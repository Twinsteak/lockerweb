/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import {
  QueryCommand,
  type AttributeValue,
  type DeleteItemInput,
  type GetItemInput,
  type GetItemOutput,
  type QueryInput,
  type QueryOutput,
  type UpdateItemInput,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  ConditionalCheckFailedException,
} from '@aws-sdk/client-dynamodb';
import { dynamoDB, TableName } from '../util/database.js';
import { NotFoundError } from '../util/error.js';

function fromLockerSubsectionData(data: LockerSubsectionData): LockerSubsection {
  return {
    department: data.d.S,
    range: [parseInt(data.r?.L[0]?.N ?? '0'), parseInt(data.r?.L[1]?.N ?? '0')],
  };
}

function toLockerSubsectionData(subsection: LockerSubsection): LockerSubsectionData {
  return {
    d: { S: subsection.department },
    r: {
      L: [{ N: `${subsection.range[0] ?? 0}` }, { N: `${subsection.range[1] ?? 0}` }],
    },
  };
}

function fromLockerSectionData(data: LockerSectionData): LockerSection {
  return {
    subsections: data.s.L.map((subsectionData) => fromLockerSubsectionData(subsectionData.M)),
    disabled: data?.d?.NS?.map((disabled) => parseInt(disabled)) ?? [],
    height: parseInt(data.h?.N ?? '0'),
  };
}

function toLockerSectionData(section: LockerSection): LockerSectionData {
  return {
    s: {
      L: section.subsections.map((ss) => ({ M: toLockerSubsectionData(ss) })),
    },
    ...(section.disabled &&
      section.disabled.length && {
        d: { NS: section.disabled.map((d) => `${d}`) },
      }),
    h: { N: `${section.height}` },
  };
}

function toBuildingData(building: Building): BuildingData {
  return {
    i: { S: building.id },
    n: { S: building.name },
    l: {
      M: Object.fromEntries(
        Object.entries(building.lockers).map(([floor, lockerSectionMap]) => {
          return [
            floor,
            {
              M: Object.fromEntries(
                Object.entries(lockerSectionMap).map(([lockerName, section]) => [
                  lockerName,
                  { M: toLockerSectionData(section) },
                ]),
              ),
            },
          ];
        }),
      ),
    },
  };
}

function fromBuildingData(data: BuildingData): Building {
  return {
    id: data.i.S,
    name: data.n.S,
    lockers: Object.fromEntries(
      Object.entries(data.l.M).map(([floor, lockerSectionDataMap]) => {
        return [
          floor,
          Object.fromEntries(
            Object.entries(lockerSectionDataMap.M).map(([lockerName, sectionData]) => [
              lockerName,
              fromLockerSectionData(sectionData.M),
            ]),
          ),
        ];
      }),
    ),
  };
}

function toConfigDao(data: Config): ConfigDao {
  return {
    type: { S: 'config' },
    id: { S: data.id },
    n: { S: data.name },
    ...(data.activateFrom && { aF: { S: data.activateFrom.toISOString() } }),
    ...(data.activateTo && { aT: { S: data.activateTo.toISOString() } }),
  };
}

function fromConfigDao(dao: ConfigDao): Config {
  return {
    id: dao.id?.S ?? 'SERVICE',
    name: dao.n?.S ?? 'IT대학 사물함 시스템',
    ...(dao.aF && { activateFrom: new Date(dao.aF.S) }),
    ...(dao.aT && { activateTo: new Date(dao.aT.S) }),
  };
}

function toServiceConfigDao(data: ServiceConfig): ServiceConfigDao {
  return {
    ...toConfigDao(data),
    b: {
      M: Object.fromEntries(
        Object.entries(data.buildings).map(([s, b]) => [s, { M: toBuildingData(b) }]),
      ),
    },
    ...(data.alert && { a: { S: data.alert } }),
  };
}

function fromServiceConfigDao(dao: ServiceConfigDao): ServiceConfig {
  return {
    ...fromConfigDao(dao),
    buildings: Object.fromEntries(
      Object.entries(dao.b?.M ?? {}).map(([s, bd]) => [s, fromBuildingData(bd.M)]),
    ),
    ...(dao.a?.S && { alert: dao.a.S }),
  };
}

function toDepartmentConfigDao(data: DepartmentConfig): DepartmentConfigDao {
  return {
    ...toConfigDao(data),
    ...(data.contact && { c: { S: data.contact } }),
  };
}

function fromDepartmentConfigDao(dao: DepartmentConfigDao): DepartmentConfig {
  return {
    ...fromConfigDao(dao),
    ...(dao.c && { contact: dao.c.S }),
  };
}

export function toConfigResponse(config: Config): ConfigResponse {
  return {
    ...config,
    ...(config.activateFrom && {
      activateFrom: config.activateFrom.toISOString(),
    }),
    ...(config.activateTo && { activateTo: config.activateTo.toISOString() }),
  };
}

export const queryConfig = async function (startsWith = ''): Promise<Array<Config>> {
  let composedRes: Array<Config> = [];
  const req: QueryInput = {
    TableName,
    KeyConditionExpression: `#type = :v1${startsWith ? ' AND begins_with(#id, :v2)' : ''}`,
    ExpressionAttributeNames: {
      '#type': 'type',
      ...(startsWith && { '#id': 'id' }),
    },
    ExpressionAttributeValues: {
      ':v1': { S: 'config' },
      ...(startsWith && { ':v2': { S: `${startsWith}` } }),
    },
  };
  let res: QueryOutput;
  do {
    try {
      const cmd = new QueryCommand({
        ...req,
        ...(res &&
          res.LastEvaluatedKey && {
            ExclusiveStartKey: res.LastEvaluatedKey,
          }),
      });
      res = await dynamoDB.send(cmd);
    } catch (e) {
      if (e instanceof ConditionalCheckFailedException) {
        throw new NotFoundError('Cannot find config');
      }
      throw e;
    }
    composedRes = [
      ...composedRes,
      ...res.Items.map<Config>((v) =>
        v.id.S === 'SERVICE'
          ? fromServiceConfigDao(v as unknown as ServiceConfigDao)
          : fromDepartmentConfigDao(v as unknown as DepartmentConfigDao),
      ),
    ];
  } while (res.LastEvaluatedKey);
  return composedRes;
};

export const getConfig = async function (id: string): Promise<Config> {
  const req: GetItemInput = {
    TableName,
    Key: {
      type: { S: 'config' },
      id: { S: `${id}` },
    },
  };
  let res: GetItemOutput;
  try {
    const cmd = new GetItemCommand(req);
    res = await dynamoDB.send(cmd);
  } catch (e) {
    if (e instanceof ConditionalCheckFailedException) {
      throw new NotFoundError(`Cannot find config of id ${id}`);
    }
    throw e;
  }
  if (res.Item === undefined) {
    throw new NotFoundError(`Cannot find config of id ${id}`);
  }
  const dao: ConfigDao = res.Item as unknown as ConfigDao;
  return dao.id.S === 'SERVICE'
    ? fromServiceConfigDao(dao as ServiceConfigDao)
    : fromDepartmentConfigDao(dao as DepartmentConfigDao);
};

export const updateConfig = async function (config: ConfigUpdateRequest) {
  const attributes: Record<string, AttributeValue> = {};
  const attributeNames: Record<string, string> = {};
  let updateExp = '';
  let removeExp = '';
  if (config.name) {
    attributes[':name'] = { S: config.name };
    updateExp = 'SET n = :name';
  }
  if (config.activateFrom) {
    attributes[':activateFrom'] = { S: config.activateFrom };
    updateExp += `${updateExp ? ',' : 'SET'} aF = :activateFrom`;
  }
  if (config.activateTo) {
    attributes[':activateTo'] = { S: config.activateTo };
    attributeNames['#aT'] = 'aT';
    updateExp += `${updateExp ? ',' : 'SET'} #aT = :activateTo`;
  }
  if (config.alert) {
    attributes[':alert'] = { S: config.alert };
    attributeNames['#a'] = 'a';
    updateExp += `${updateExp ? ',' : 'SET'} #a = :alert`;
  }
  if (config.activateFrom === null) {
    removeExp += `${removeExp ? ',' : 'REMOVE'} aF`;
  }
  if (config.activateTo === null) {
    attributeNames['#aT'] = 'aT';
    removeExp += `${removeExp ? ',' : 'REMOVE'} #aT`;
  }
  if (config.alert === null) {
    attributeNames['#a'] = 'a';
    removeExp += `${removeExp ? ',' : 'REMOVE'} #a`;
  }
  if ((config as ServiceConfigUpdateRequest).buildings) {
    const buildings = (config as ServiceConfigUpdateRequest).buildings;
    attributes[':buildings'] = {
      M: Object.fromEntries(
        Object.entries(buildings).map(([s, b]) => [s, { M: toBuildingData(b) }]),
      ),
    };
    updateExp += `${updateExp ? ',' : 'SET'} b = :buildings`;
  }
  if ((config as DepartmentConfigUpdateRequest).contact) {
    attributes[':contact'] = {
      S: (config as DepartmentConfigUpdateRequest).contact,
    };
    updateExp += `${updateExp ? ',' : 'SET'} c = :contact`;
  }
  if ((config as DepartmentConfigUpdateRequest).contact === null) {
    removeExp += `${removeExp ? ',' : 'REMOVE'} c`;
  }

  const req: UpdateItemInput = {
    TableName,
    Key: {
      type: { S: 'config' },
      id: { S: config.id },
    },
    UpdateExpression: updateExp + `${removeExp ? ' ' + removeExp : ''}`,
    ...(Object.keys(attributeNames).length && {
      ExpressionAttributeNames: attributeNames,
    }),
    ...(Object.keys(attributes).length && {
      ExpressionAttributeValues: attributes,
    }),
  };
  const cmd = new UpdateItemCommand(req);
  await dynamoDB.send(cmd);
  return config;
};

export const deleteConfig = async function (id: string): Promise<string> {
  const req: DeleteItemInput = {
    TableName,
    Key: {
      type: { S: 'config' },
      id: { S: id },
    },
  };
  const cmd = new DeleteItemCommand(req);
  await dynamoDB.send(cmd);
  return id;
};
