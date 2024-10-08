/* Common DAO Definition */

type DaoData = {
  type: { S: `user` | 'config' };
  id: { S: string };
};

/* User Definition */

type User = {
  id: string;
  name: string;
  isAdmin: boolean;
  department: string;
  lockerId?: string;
  claimedUntil?: Date;
};

type UserResponse = {
  id: string;
  name: string;
  isAdmin: boolean;
  department: string;
  lockerId?: string;
  claimedUntil?: string;
};

type UserPutRequest = UserResponse;
type BatchUserPutRequest = UserPutRequest[];

type UserUpdateRequest = {
  id: string;
  name?: string;
  isAdmin?: boolean;
  department?: string;
  lockerId?: string | null;
  claimedUntil?: number | null;
};

type UserDeleteRequest = {
  id: string;
};

type UserDao = DaoData & {
  n: { S: string };
  iA: { BOOL: boolean };
  d: { S: string };
  lockerId?: { S: string };
  cU?: { N: string };
};

type AccessTokenInfo = {
  id: string;
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

/* Locker Definition */

type ReservedLocker = {
  id?: string;
  lockerId: string;
  claimedUntil?: Date;
};

type ReservedLockerResponse = {
  id?: string;
  lockerId: string;
  claimedUntil?: string;
};
type ClaimLockerResponse = ReservedLockerResponse;

type UnclaimLockerResponse = {
  id: string;
  lockerId: string;
};

/* Config Definition */

type Config = {
  id: string;
  name: string;
  activateFrom?: Date;
  activateTo?: Date;
};

type ConfigResponse = {
  id: string;
  name: string;
  activateFrom?: string;
  activateTo?: string;
};

type ConfigDao = DaoData & {
  n: { S: string };
  aF?: { S: string };
  aT?: { S: string };
};

type DepartmentConfig = Config & {
  contact?: string;
};

type DepartmentConfigResponse = ConfigResponse & {
  contact?: string;
};

type DepartmentConfigDao = DaoData &
  ConfigDao & {
    c?: { S: string };
  };

type ServiceConfig = Config & {
  buildings: {
    [buildingId: string]: Building;
  };
  alert?: string;
};

type ServiceConfigResponse = ConfigResponse & {
  buildings: {
    [buildingId: string]: Building;
  };
  alert?: string;
};

type ServiceConfigDao = DaoData &
  ConfigDao & {
    b: { M: { [buildingId: string]: { M: BuildingData } } };
    a?: { S: string };
  };

type Building = {
  id: string;
  name: string;
  lockers: {
    [floor: string]: {
      [lockerName: string]: LockerSection;
    };
  };
};

type BuildingData = {
  i: { S: string };
  n: { S: string };
  l: {
    M: {
      [floor: string]: {
        M: {
          [lockerName: string]: { M: LockerSectionData };
        };
      };
    };
  };
};

type LockerSection = {
  subsections: LockerSubsection[];
  disabled: number[];
  height: number;
};

type LockerSectionData = {
  s: { L: { M: LockerSubsectionData }[] };
  d: { NS: string[] };
  h: { N: string };
};

type LockerSubsection = {
  department: string;
  range: [number, number];
};

type LockerSubsectionData = {
  d: { S: string };
  r: { L: [{ N: string }, { N: string }] };
};

type ConfigUpdateRequest = {
  id: string;
  name?: string;
  activateFrom?: string | null;
  activateTo?: string | null;
  alert?: string | null;
};

type DepartmentConfigUpdateRequest = ConfigUpdateRequest & {
  contact?: string;
};

type ServiceConfigUpdateRequest = ConfigUpdateRequest & {
  buildings?: {
    [buildingId: string]: Building;
  };
};

type ConfigDeleteRequest = {
  id: string;
};

type LockerCountResponse = {
  [departmentId: string]: {
    [buildingNum: string]: {
      [floor: string]: number;
    };
  };
};

/* Response Definition */

type Response = {
  success: boolean;
};

type SuccessResponse<T> = {
  success: true;
  result?: T;
};

type ErrorResponse<E extends LockerError> = {
  success: false;
  error: E;
};

type BadRequestError = LockerError & {
  code: 400;
  name: 'BadRequest';
};

type UnauthorizedError = LockerError & {
  code: 401;
  name: 'Unauthorized';
};

type ForbiddenError = LockerError & {
  code: 403;
  name: 'Forbidden';
};

type BlockedError = LockerError & {
  code: 403;
  name: 'Blocked';
};

type NotFoundError = LockerError & {
  code: 404;
  name: 'NotFound';
};

type CantClaimError = LockerError & {
  code: 403;
  name: 'CantClaim';
};

type CantUnclaimError = LockerError & {
  code: 403;
  name: 'CantUnclaim';
};

type InternalError = LockerError & {
  code: 500;
  name: 'InternalError';
};

/* Error Definition */

interface LockerError {
  code: number;
  name: string;
  message?: string;
  additionalInfo?: Record<string, unknown>;
}
