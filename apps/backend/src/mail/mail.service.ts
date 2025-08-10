import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
	private readonly logger = new Logger(MailService.name);

	constructor(private readonly mailer: MailerService) {}

	async sendPasswordResetEmail(to: string, resetUrl: string) {
		try {
			await this.mailer.sendMail({
				to,
				subject: 'Восстановление пароля',
				html: `
					<div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.5;">
						<h2>Восстановление пароля</h2>
						<p>Вы запросили восстановление пароля. Нажмите на кнопку ниже, чтобы установить новый пароль. Ссылка действительна 60 минут.</p>
						<p style="margin:24px 0;">
							<a href="${resetUrl}" style="background:#ca181f;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">Сбросить пароль</a>
						</p>
						<p>Если вы не запрашивали восстановление, просто игнорируйте это письмо.</p>
						<p style="color:#6b7280; font-size:12px;">Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер: <br />${resetUrl}</p>
					</div>
				`,
			});
		} catch (err) {
			this.logger.error(`Failed to send reset email to ${to}`, err);
			// не пробрасываем ошибку дальше — не раскрываем существование email
		}
	}
}
