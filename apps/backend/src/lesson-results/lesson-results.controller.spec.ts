import { Test, TestingModule } from '@nestjs/testing';
import { LessonResultsController } from './lesson-results.controller';
import { LessonResultsService } from './lesson-results.service';

describe('LessonResultsController', () => {
  let controller: LessonResultsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonResultsController],
      providers: [LessonResultsService],
    }).compile();

    controller = module.get<LessonResultsController>(LessonResultsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
