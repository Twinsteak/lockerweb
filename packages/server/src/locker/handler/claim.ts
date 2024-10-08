import type { APIGatewayProxyHandler } from 'aws-lambda';
import { createResponse } from '../../common.js';
import { claimLocker } from '../data.js';
import { getUser } from '../../user/data.js';
import { isValidLocker } from '../../util/locker.js';
import { queryConfig } from '../../config/data.js';
import {
  BadRequestError,
  errorResponse,
  InternalError,
  responseAsLockerError,
} from '../../util/error.js';
import { getBlockedDepartments, verifyPayload } from '../../util/access.js';

export const claimLockerHandler: APIGatewayProxyHandler = async (event) => {
  const token = (event.headers.Authorization ?? '').replace('Bearer ', '');
  let data: {
    lockerId: string;
    until?: string;
  };
  try {
    data = JSON.parse(event.body) as { lockerId: string; until?: string };
  } catch {
    return errorResponse(new BadRequestError('Request body is malformed JSON'));
  }
  if (!data.lockerId) {
    return errorResponse(new BadRequestError('Key "locker_id" is must be given'));
  }
  try {
    const payload = verifyPayload(token);
    const id = payload.aud as string;
    const user = await getUser(id);
    const configs = await queryConfig();
    const serviceConfig: ServiceConfig = configs.find(
      (c: Config) => c.id === 'SERVICE',
    ) as ServiceConfig;
    if (!serviceConfig) {
      return errorResponse(new InternalError('Cannot find available lockers'));
    }
    const blockedDepartments = getBlockedDepartments(configs);
    const isServiceBlocked = blockedDepartments.includes('SERVICE');
    if (!isValidLocker(serviceConfig, data.lockerId, user.department)) {
      return errorResponse(new InternalError('Unknown locker data'));
    }
    if (data.until !== undefined && typeof data.until !== 'number') {
      return errorResponse(new BadRequestError('Key "until" is must be an number'));
    }
    const lockerId = data.lockerId;
    const until = data?.until;
    let res: ClaimLockerResponse;
    if (until) {
      res = await claimLocker(
        id,
        token,
        blockedDepartments,
        isServiceBlocked,
        lockerId,
        new Date(until).getTime(),
      );
    } else {
      res = await claimLocker(id, token, blockedDepartments, isServiceBlocked, lockerId);
    }
    return createResponse(200, { success: true, result: res });
  } catch (e) {
    return responseAsLockerError(e);
  }
};
