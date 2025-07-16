import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Quiz {
  @ApiProperty({ description: 'Уникальный идентификатор теста' })
  id: number;

  @ApiProperty({ description: 'Название теста' })
  name: string;

  @ApiPropertyOptional({ description: 'Продолжительность в минутах' })
  duration?: number;

  @ApiPropertyOptional({ description: 'Максимальное количество баллов' })
  maxScore?: number;

  @ApiPropertyOptional({ description: 'Дата начала' })
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Дата окончания' })
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Активен ли тест' })
  isActive?: boolean;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления' })
  deletedAt?: Date;

  @ApiPropertyOptional({ description: 'Вопросы теста' })
  questions?: Question[];

  @ApiPropertyOptional({ description: 'Результаты студентов' })
  submissions?: QuizSubmission[];

  @ApiPropertyOptional({ description: 'Связанные материалы' })
  materials?: any;
}

export class Question {
  @ApiProperty({ description: 'Уникальный идентификатор вопроса' })
  id: number;

  @ApiProperty({ description: 'Текст вопроса' })
  name: string;

  @ApiProperty({ description: 'Тип вопроса' })
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TEXT';

  @ApiProperty({ description: 'ID теста' })
  quizId: number;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления' })
  deletedAt?: Date;

  @ApiPropertyOptional({ description: 'Варианты ответов' })
  answers?: Answer[];
}

export class Answer {
  @ApiProperty({ description: 'Уникальный идентификатор ответа' })
  id: number;

  @ApiProperty({ description: 'Текст ответа' })
  name: string;

  @ApiProperty({ description: 'Правильный ли ответ' })
  isCorrect: boolean;

  @ApiProperty({ description: 'ID вопроса' })
  questionId: number;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления' })
  deletedAt?: Date;
}

export class QuizSubmission {
  @ApiProperty({ description: 'Уникальный идентификатор результата' })
  id: number;

  @ApiProperty({ description: 'ID студента' })
  studentId: number;

  @ApiProperty({ description: 'ID теста' })
  quizId: number;

  @ApiPropertyOptional({ description: 'Ответы в формате JSON' })
  answers?: string;

  @ApiProperty({ description: 'Дата отправки' })
  submittedAt: Date;

  @ApiPropertyOptional({ description: 'Оценка' })
  score?: number;

  @ApiPropertyOptional({ description: 'Обратная связь' })
  feedback?: string;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Дата удаления' })
  deletedAt?: Date;

  @ApiPropertyOptional({ description: 'Информация о студенте' })
  student?: any;

  @ApiPropertyOptional({ description: 'Информация о тесте' })
  quiz?: any;
}
