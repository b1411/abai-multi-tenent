interface BiometricCredential {
  id: string;
  email: string;
  displayName: string;
}

class BiometricService {
  private credentialsKey = 'biometric_credentials';

  // Проверяем поддержку WebAuthn
  isSupported(): boolean {
    return !!(navigator.credentials && window.PublicKeyCredential);
  }

  // Проверяем доступность биометрии
  async isBiometricAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false;
    
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  }

  // Регистрируем биометрические данные
  async registerBiometric(email: string, displayName: string): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        throw new Error('WebAuthn не поддерживается в этом браузере');
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const userId = new TextEncoder().encode(email);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Fizmat.AI',
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: email,
            displayName,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
          attestation: 'direct',
        },
      }) as PublicKeyCredential;

      if (credential) {
        // Сохраняем данные о зарегистрированном credential
        const credentialData: BiometricCredential = {
          id: credential.id,
          email,
          displayName,
        };
        
        this.saveCredential(credentialData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Ошибка регистрации биометрии:', error);
      throw error;
    }
  }

  // Аутентификация через биометрию
  async authenticateWithBiometric(): Promise<string | null> {
    try {
      if (!this.isSupported()) {
        throw new Error('WebAuthn не поддерживается в этом браузере');
      }

      const credentials = this.getStoredCredentials();
      if (credentials.length === 0) {
        throw new Error('Нет сохраненных биометрических данных');
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const allowCredentials = credentials.map(cred => ({
        id: Uint8Array.from(atob(cred.id), c => c.charCodeAt(0)),
        type: 'public-key' as const,
      }));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials,
          userVerification: 'required',
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      if (assertion) {
        // Находим соответствующий credential
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));
        const matchedCredential = credentials.find(cred => cred.id === credentialId);
        
        if (matchedCredential) {
          return matchedCredential.email;
        }
      }
      return null;
    } catch (error) {
      console.error('Ошибка биометрической аутентификации:', error);
      throw error;
    }
  }

  // Проверяем есть ли сохраненные биометрические данные
  hasStoredCredentials(): boolean {
    const credentials = this.getStoredCredentials();
    return credentials.length > 0;
  }

  // Получаем сохраненные учетные данные
  getStoredCredentials(): BiometricCredential[] {
    try {
      const stored = localStorage.getItem(this.credentialsKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Сохраняем учетные данные
  private saveCredential(credential: BiometricCredential): void {
    const credentials = this.getStoredCredentials();
    // Удаляем существующие учетные данные для этого email
    const filtered = credentials.filter(cred => cred.email !== credential.email);
    filtered.push(credential);
    localStorage.setItem(this.credentialsKey, JSON.stringify(filtered));
  }

  // Удаляем биометрические данные
  removeBiometricData(email?: string): void {
    if (email) {
      const credentials = this.getStoredCredentials();
      const filtered = credentials.filter(cred => cred.email !== email);
      localStorage.setItem(this.credentialsKey, JSON.stringify(filtered));
    } else {
      localStorage.removeItem(this.credentialsKey);
    }
  }

  // Получаем список пользователей с биометрией
  getBiometricUsers(): BiometricCredential[] {
    return this.getStoredCredentials();
  }
}

export default new BiometricService();
