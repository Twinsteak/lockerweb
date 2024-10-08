import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponse } from '../../common.js';
import { queryLockers } from '../data.js';
import { assertAccessible } from '../../auth/data.js';
import { verifyPayload } from '../../util/access.js';
import { responseAsLockerError } from '../../util/error.js';

export const queryClaimedLockersHandler: APIGatewayProxyHandler = async (event) => {
  const token = (event.headers.Authorization ?? '').replace('Bearer ', '');
  const showId = event.queryStringParameters?.show_id === 'true';
  try {
    const payload = verifyPayload(token);
    const id = payload.aud as string;
    await assertAccessible(id, token, showId);
    const result = (await queryLockers('', showId)).map((locker) => ({
      ...locker,
      ...(locker.claimedUntil && {
        claimedUntil: locker.claimedUntil.toISOString(),
      }),
    }));
    return createResponse(200, {
      success: true,
      result,
    });
  } catch (e) {
    return responseAsLockerError(e);
  }
};
