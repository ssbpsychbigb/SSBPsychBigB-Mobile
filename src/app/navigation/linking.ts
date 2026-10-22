/**
 * Deep links for Learn and assessments — same paths as the web learner app.
 */

import {
  getStateFromPath as defaultGetStateFromPath,
  type LinkingOptions,
} from '@react-navigation/native';

import type { RootStackParamList } from '@/app/navigation/types';

export const rootLinking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'bigb://',
    'https://app.bigb.in',
    'https://ssbpsychbigb.com',
    'https://www.ssbpsychbigb.com',
  ],
  getStateFromPath(path, options) {
    const [head = ''] = String(path || '').replace(/^\/+/, '').split('?');
    const clean = head.replace(/\/$/, '');
    if (clean === 'assessments') {
      return {
        routes: [
          {
            name: 'App',
            state: {
              routes: [{ name: 'myCourse', params: { hub: 'tests' } }],
            },
          },
        ],
      };
    }
    return defaultGetStateFromPath(path, options);
  },
  config: {
    screens: {
      App: {
        screens: {
          homepage: '',
          myCourse: 'learn',
        },
      },
      CourseDetail: 'learn/courses/:slug',
      LessonPlayer: 'learn/courses/:slug/lessons/:lessonId',
      CourseCheckout: 'learn/checkout/:slug',
      CourseWishlist: 'learn/wishlist',
      LearningPathDetail: 'learn/paths/:pathSlug',
      MyCertificates: 'learn/certificates',
      CertificateVerify: 'certificates/verify/:code',
      AssessmentDetail: 'assessments/:slug',
      AssessmentAttempt: 'assessments/:slug/attempt/:attemptId',
      AssessmentResult: 'assessments/:slug/attempt/:attemptId/result',
      AssessmentLeaderboard: 'assessments/:slug/leaderboard',
      AssessmentCheckout: 'assessments/:slug/checkout',
    },
  },
};
