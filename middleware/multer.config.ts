import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'public', 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

// Define the Multer options
export const multerOptions: MulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    },
  }),
  fileFilter: (req, file, cb) => {
    const supportedFiles =
      /\.(jpg|jpeg|png|pdf|docx|xlsx|xls|doc|mp4|mov|avi|zip|rar|mp3|m4a|aac|wav|ogg|opus|3gp)$/i;
    if (supportedFiles.test(extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          'Invalid file type. Supported types: jpg, jpeg, png, pdf, docx, xlsx, xls, doc, mp4, mov, avi, zip, rar, mp3, m4a, aac, wav, ogg, opus, 3gp',
        ),
        false,
      );
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
};
