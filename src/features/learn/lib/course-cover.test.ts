import { slugFromCourseCoverPath } from '@/features/learn/lib/course-cover';

describe('slugFromCourseCoverPath', () => {
  it('reads the web demo cover slug', () => {
    expect(slugFromCourseCoverPath('/course-covers/bigb-orientation.jpg')).toBe(
      'bigb-orientation',
    );
  });

  it('ignores uploads', () => {
    expect(slugFromCourseCoverPath('/uploads/courses/cover.jpg')).toBeNull();
  });
});
