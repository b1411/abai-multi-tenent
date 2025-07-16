import { Test, TestingModule } from '@nestjs/testing';
import { LessonResultsService } from './lesson-results.service';

describe('LessonResultsService', () => {
  let service: LessonResultsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LessonResultsService],
    }).compile();

    service = module.get<LessonResultsService>(LessonResultsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
