import {
  UpdateItemCommand,
  type GetItemInput,
  type UpdateItemInput,
  type UpdateItemOutput,
  GetItemCommand,
  ConditionalCheckFailedException,
} from '@aws-sdk/client-dynamodb';
import { ForbiddenError, UnauthorizedError } from '../util/error.js';
import { adminId, dynamoDB, TableName } from '../util/database.js';

/* ISSUE/REVOKE TOKEN */

export const revokeToken = async function (
  id: string,
  token: string,
): Promise<{ accessToken: string }> {
  const req: UpdateItemInput = {
    TableName,
    Key: { type: { S: 'user' }, id: { S: `${id}` } },
    UpdateExpression: 'REMOVE #aT',
    ConditionExpression: '#aT = :token',
    ExpressionAttributeNames: {
      '#aT': 'aT',
    },
    ExpressionAttributeValues: {
      ':token': { S: token },
    },
    ReturnValues: 'UPDATED_OLD',
  };
  const cmd = new UpdateItemCommand(req);
  let res: UpdateItemOutput;
  try {
    res = await dynamoDB.send(cmd);
  } catch (e) {
    if (e instanceof ConditionalCheckFailedException) {
      throw new ForbiddenError('Cannot logout when token is invalid');
    }
    throw e;
  }
  if (res.Attributes.hasOwnProperty('aT')) {
    return { accessToken: token };
  } else {
    throw new UnauthorizedError();
  }
};

export const issueToken = async function (
  id: string,
  token: string,
): Promise<{ id: string; expires: number }> {
  const expires = Date.now() + 3600 * 1000 * 24;
  const req: UpdateItemInput = {
    TableName,
    Key: { type: { S: 'user' }, id: { S: `${id}` } },
    UpdateExpression: 'SET #aT = :token, eO = :expiresOn',
    ExpressionAttributeNames: {
      '#aT': 'aT',
    },
    ...(id !== adminId && {
      ConditionExpression: 'iA = :true OR attribute_exists(d)',
    }),
    ExpressionAttributeValues: {
      ':token': { S: token },
      ':expiresOn': { N: `${expires}` },
      ...(id !== adminId && { ':true': { BOOL: true } }),
    },
    ReturnValues: 'ALL_NEW',
  };
  const cmd = new UpdateItemCommand(req);
  let res: UpdateItemOutput;
  try {
    res = await dynamoDB.send(cmd);
  } catch (e) {
    if (e instanceof ConditionalCheckFailedException) {
      throw new ForbiddenError('This user cannot login to service');
    }
    throw e;
  }
  if (res.Attributes.hasOwnProperty('aT') && res.Attributes.aT.S === token) {
    return { id, expires };
  } else {
    throw new ForbiddenError('Cannot issue token', { id, expires });
  }
};

export async function assertAccessible(
  id: string,
  token: string,
  adminOnly = false,
): Promise<boolean> {
  const authReq: GetItemInput = {
    TableName,
    Key: {
      type: { S: 'user' },
      id: {
        S: `${id}`,
      },
    },
  };
  const authCmd = new GetItemCommand(authReq);
  const authRes = await dynamoDB.send(authCmd);
  if (
    authRes.Item.id.S !== `${id}` ||
    authRes.Item.aT?.S !== token ||
    (adminOnly && authRes.Item.iA?.BOOL !== true && id !== adminId)
  ) {
    throw new ForbiddenError('Sufficient permission');
  }
  return true;
}
