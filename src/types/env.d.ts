/**
 * Env keys are inlined from the gitignored `BigB/.env` at bundle time.
 */

declare const process: {
  env: {
    API_BASE_URL_LOCAL?: string;
    API_BASE_URL_PRODUCTION?: string;
    DEV_LAN_HOST?: string;
  };
};
