import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/uploads'); // Папка для загрузки файлов
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage });

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();

    return new Observable(observer => {
      const res = ctx.getResponse();
      if (!res) {
        observer.error(new Error('Response object is undefined'));
        return;
      }
      upload.single('file')(req, res, err => {
        if (err) {
          observer.error(err);
        } else {
          observer.next(next.handle());
          observer.complete();
        }
      });
    });
  }
}
