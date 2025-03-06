import type { APIGatewayProxyHandler } from 'aws-lambda';
import type { JwtPayload } from 'jsonwebtoken';
import { createResponse } from '../../../common.js';
import { assertAccessible } from '../../../auth/data.js';
import { batchPutUser } from '../../data.js';
import {
  BadRequestError,
  errorResponse,
  InternalError,
  responseAsLockerError,
} from '../../../util/error.js';
import { verifyPayload } from '../../../util/access.js';

export const validateData = (data: User[]): boolean => {
  return data.every((user) => !isNaN(parseInt(user.id)));
};

export const batchPutUserHandler: APIGatewayProxyHandler = async (event) => {
  const token = (event.headers.Authorization ?? '').replace('Bearer ', '');
  let data: User[];
  try {
    data = JSON.parse(event.body) as User[];
    if (!validateData(data)) return errorResponse(new BadRequestError('User id is not an number'));
  } catch {
    return errorResponse(new BadRequestError('Request body is malformed JSON'));
  }
  if (!data || !Array.isArray(data)) {
    return errorResponse(new BadRequestError('Request body is not an array'));
  }
  let payload: JwtPayload;
  try {
    payload = verifyPayload(token);
  } catch (e) {
    return responseAsLockerError(e);
  }
  let i = 0;
  try {
    const id = payload.aud as string;
    await assertAccessible(id, token, true);
    for (i = 0; i < data.length; i += 25) {
      const partialData = data.slice(i, i + 25);
      await batchPutUser(partialData);
    }
    return createResponse(200, { success: true });
  } catch (e) {
    return responseAsLockerError(e, new InternalError('Internal error'), {
      failedData: JSON.stringify(data.slice(i, data.length)),
    });
  }
};
