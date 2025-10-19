import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3StorageAdapter } from './s3.adapter';
import { S3Client } from '@aws-sdk/client-s3';

// Мокаем AWS SDK
jest.mock('@aws-sdk/client-s3');

describe('S3StorageAdapter', () => {
  let adapter: S3StorageAdapter;
  let configService: ConfigService;
  let mockS3Client: jest.Mocked<S3Client>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3StorageAdapter,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                AWS_S3_BUCKET: 'test-bucket',
                AWS_REGION: 'kz-1',
                AWS_ACCESS_KEY_ID: 'test-access-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret-key',
                AWS_S3_ENDPOINT: 'https://s3.kz-1.srvstorage.kz',
                AWS_S3_PUBLIC_URL: 'https://s3.kz-1.srvstorage.kz/test-bucket',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    adapter = module.get<S3StorageAdapter>(S3StorageAdapter);
    configService = module.get<ConfigService>(ConfigService);

    // Получаем мок S3Client
    mockS3Client = (S3Client as jest.MockedClass<typeof S3Client>).mock
      .instances[0] as jest.Mocked<S3Client>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('должен инициализироваться с правильными настройками', () => {
      expect(configService.get).toHaveBeenCalledWith('AWS_S3_BUCKET');
      expect(configService.get).toHaveBeenCalledWith('AWS_REGION');
      expect(configService.get).toHaveBeenCalledWith('AWS_ACCESS_KEY_ID');
      expect(configService.get).toHaveBeenCalledWith('AWS_SECRET_ACCESS_KEY');
      expect(configService.get).toHaveBeenCalledWith('AWS_S3_ENDPOINT');
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'kz-1',
          endpoint: 'https://s3.kz-1.srvstorage.kz',
          forcePathStyle: true,
          credentials: {
            accessKeyId: 'test-access-key',
            secretAccessKey: 'test-secret-key',
          },
        }),
      );
    });
  });

  describe('upload', () => {
    it('должен загружать файл в S3', async () => {
      const mockFile = {
        buffer: Buffer.from('test content'),
        mimetype: 'text/plain',
        size: 12,
        originalname: 'test.txt',
      } as Express.Multer.File;

      mockS3Client.send = jest.fn().mockResolvedValue({});

      const result = await adapter.upload(mockFile, 'test-category', 'test-file.txt');

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'test-category/test-file.txt',
            Body: mockFile.buffer,
            ContentType: 'text/plain',
          }),
        }),
      );

      expect(result).toEqual({
        url: 'https://s3.kz-1.srvstorage.kz/test-bucket/test-category/test-file.txt',
        pathname: 'test-category/test-file.txt',
        size: 12,
      });
    });

    it('должен выбросить ошибку при неудачной загрузке', async () => {
      const mockFile = {
        buffer: Buffer.from('test content'),
        mimetype: 'text/plain',
        size: 12,
      } as Express.Multer.File;

      mockS3Client.send = jest.fn().mockRejectedValue(new Error('Upload failed'));

      await expect(adapter.upload(mockFile, 'test-category', 'test-file.txt')).rejects.toThrow(
        'S3 upload failed: Upload failed',
      );
    });
  });

  describe('delete', () => {
    it('должен удалять файл из S3', async () => {
      const fileUrl = 'https://s3.kz-1.srvstorage.kz/test-bucket/test-category/test-file.txt';

      mockS3Client.send = jest.fn().mockResolvedValue({});

      await adapter.delete(fileUrl);

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'test-category/test-file.txt',
          }),
        }),
      );
    });

    it('должен удалять файл используя только ключ', async () => {
      const fileKey = 'test-category/test-file.txt';

      mockS3Client.send = jest.fn().mockResolvedValue({});

      await adapter.delete(fileKey);

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'test-category/test-file.txt',
          }),
        }),
      );
    });

    it('должен выбросить ошибку при неудачном удалении', async () => {
      mockS3Client.send = jest.fn().mockRejectedValue(new Error('Delete failed'));

      await expect(adapter.delete('test-file.txt')).rejects.toThrow(
        'S3 delete failed: Delete failed',
      );
    });
  });

  describe('isAvailable', () => {
    it('должен вернуть true если S3 доступен', async () => {
      mockS3Client.send = jest.fn().mockResolvedValue({});

      const result = await adapter.isAvailable();

      expect(result).toBe(true);
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'test-bucket',
          }),
        }),
      );
    });

    it('должен вернуть false если S3 недоступен', async () => {
      mockS3Client.send = jest.fn().mockRejectedValue(new Error('Connection failed'));

      const result = await adapter.isAvailable();

      expect(result).toBe(false);
    });
  });
});
