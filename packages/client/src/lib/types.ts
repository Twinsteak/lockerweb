/* API Call types */

export type FetchError = LockerError & {
  code: 500;
  name: 'FetchError';
};
export type UnknownError = LockerError & {
  code: 500;
  name: 'UnknownError';
};

/* LockerCount Types */

export type LockerCount = {
  [department: string]: DepartmentLockerCount;
};

export type DepartmentLockerCount = {
  departmentName: string;
  lockerLeft: number;
  totalLocker: number;
  activateFrom?: Date;
  activateTo?: Date;
  contact: string;
  lockers: {
    [buildingId: string]: {
      [floor: string]: {
        totalLocker: number;
        lockerLeft: number;
      };
    };
  };
};

export type DepthData = {
  id: string;
  name: string;
  children?: DepthData[];
};

/* ServiceSettings Editor Types */

export type BuildingRemoveRequest = { id: string };
export type BuildingUpdateRequest = { id: string; name: string };

export type SectionRemoveRequest = { floor: string; id: string };
export type SectionUpdateRequest = {
  floor: string;
  id: string;
  height: number;
  disabled: number[];
  subsections: LockerSubsection[];
};
