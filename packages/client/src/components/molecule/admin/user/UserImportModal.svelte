<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from '../../Modal.svelte';
  import PeopleTeamAdd from '../../../../icons/PeopleTeamAdd.svelte';
  import Dismiss from '../../../../icons/Dismiss.svelte';
  import { config } from '$lib/store';
  import Select from '../../../atom/form/Select.svelte';
  import FileInput from '../../../atom/form/FileInput.svelte';
  import type { WorkBook } from 'xlsx';
  import { read, utils } from 'xlsx';
  import Checkbox from '../../../atom/form/Checkbox.svelte';
  import isEqual from 'lodash.isequal';
  import { getDepartmentConfigs } from '$lib/api/config';

  const dispatch = createEventDispatcher<{ submit: { overwrite: boolean; users: User[] } }>();

  $: departments = $config && $config.success ? getDepartmentConfigs($config.result) : [];

  export let open = false;

  const title = '사용자 가져오기';
  let department = null;
  let files: FileList = null;

  let workbook: WorkBook;
  let data: unknown[];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let error: Error;
  let userConversion = null;
  let nameConversion = null;
  let overwrite = false;
  let dropdownItems = [];
  let isValidData = false;

  let users: User[];

  $: if (files) {
    files[0]
      .arrayBuffer()
      .then((buf) => {
        try {
          workbook = read(buf, { type: 'buffer' });
          data = utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        } catch (err) {
          error = err;
          console.error(err);
        }
      })
      .catch((err) => {
        error = err;
        console.error(err);
      });
  }

  $: if (data) {
    isValidData = false;
    const updatedItems = data
      ? [
        ...Object.keys(data[0])
          .filter((k) => k !== '__rowNum__')
          .map((k, idx) => ({
            id: idx,
            name: k,
          })),
      ]
      : [];
    if (!isEqual(dropdownItems, updatedItems)) dropdownItems = updatedItems;
  }

  $: if (dropdownItems && dropdownItems.length) {
    if (userConversion === null) userConversion = 0;
    if (nameConversion === null) nameConversion = 0;
  }

  $: if (department && workbook && data && userConversion !== null && nameConversion !== null) {
    if (data.every((userRow) => !isNaN(parseInt(userRow[dropdownItems[userConversion].name])))) {
      isValidData = true;
      const newUsers = data.map((userRow) => ({
        id: userRow[dropdownItems[userConversion].name],
        name: userRow[dropdownItems[nameConversion].name],
        department: department,
        isAdmin: false,
      }));
      if (!isEqual(newUsers, users)) users = newUsers;
    }
  }

  function closeModal() {
    open = false;
  }

  function submitUsers() {
    if (users) dispatch('submit', { overwrite, users });
  }
</script>

<Modal
  on:close
  on:click:secondary={closeModal}
  on:click={submitUsers}
  {title}
  bind:open
  primaryText="업로드"
  primaryDisabled={!users || !isValidData}
  isPrimaryBtnIconRight
  isSecondaryBtnIconRight
  {...$$restProps}>
  <div class="flex flex-col gap-3">
    <Select
      id="department"
      label="업로드 대상 학과(부)"
      showLabel
      bind:value={department}
      required
      invalidText="이 값은 필수입니다."
      invalidClass="text-red-800">
      {#each departments as deptOption}
        <option value={deptOption.id}>{deptOption.name}</option>
      {/each}
    </Select>
    <FileInput
      id="import_file"
      label="사용자 목록 업로드"
      showLabel
      bind:files
      required
      invalidText="이 값은 필수입니다."
      invalidClass="text-red-800"
      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
    <Select
      id="id"
      label="학번을 읽을 열"
      showLabel
      bind:value={userConversion}
      disabled={dropdownItems ? undefined : true}
      required
      invalidText="이 값은 필수입니다."
      invalidClass="text-red-800">
      {#each dropdownItems as col}
        <option value={col.id}>{col.name}</option>
      {/each}
    </Select>
    <Select
      id="name"
      label="이름을 읽을 열"
      showLabel
      bind:value={nameConversion}
      disabled={dropdownItems ? undefined : true}
      required
      invalidText="이 값은 필수입니다."
      invalidClass="text-red-800">
      {#each dropdownItems as col}
        <option value={col.id}>{col.name}</option>
      {/each}
    </Select>
    <Checkbox id="overwrite" label="사용자 덮어쓰기" showLabel bind:checked={overwrite} />
  </div>
  <PeopleTeamAdd slot="primaryIcon" />
  <Dismiss slot="secondaryIcon" />
</Modal>
