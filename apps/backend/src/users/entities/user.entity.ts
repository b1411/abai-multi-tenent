import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../dto/create-user.dto';

export class User {
  @ApiProperty({ description: 'ID пользователя' })
  id: number;

  @ApiProperty({ description: 'Email пользователя' })
  email: string;

  @ApiProperty({ description: 'Имя пользователя' })
  name: string;

  @ApiProperty({ description: 'Фамилия пользователя' })
  surname: string;

  @ApiPropertyOptional({ description: 'Номер телефона', nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ description: 'Отчество пользователя', nullable: true })
  middlename: string | null;

  @ApiPropertyOptional({ description: 'URL аватара пользователя', nullable: true })
  avatar: string | null;

  @ApiProperty({ description: 'Роль пользователя', enum: UserRole })
  role: UserRole;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления', nullable: true })
  deletedAt: Date | null;

  // Хешированный пароль не включаем в API ответы
}
