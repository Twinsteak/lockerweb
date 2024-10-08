<script lang="ts">
  import UserDatatable from './UserDatatable.svelte';
  import Button from '../../../atom/Button.svelte';
  import Add from '../../../../icons/Add.svelte';
  import DocumentTable from '../../../../icons/DocumentTable.svelte';
  import TabGroup from '../../../atom/TabGroup.svelte';
  import TabItem from '../../../atom/TabItem.svelte';
  import { config } from '$lib/store';
  import UserEditModal from './UserEditModal.svelte';
  import UpdateScreen from '../../../atom/UpdateScreen.svelte';
  import ErrorScreen from '../../../atom/ErrorScreen.svelte';
  import { createEventDispatcher } from 'svelte';
  import PeopleTeamAdd from '../../../../icons/PeopleTeamAdd.svelte';
  import UserImportModal from './UserImportModal.svelte';
  import Modal from '../../Modal.svelte';
  import UserExportModal from './UserExportModal.svelte';
  import PeopleTeamDelete from '../../../../icons/PeopleTeamDelete.svelte';
  import Dismiss from '../../../../icons/Dismiss.svelte';
  import DocumentHeaderRemove from '../../../../icons/DocumentHeaderRemove.svelte';
  import { utils, writeXLSX } from 'xlsx';
  import { getDepartmentConfigs } from '$lib/api/config';

  const dispatch = createEventDispatcher<{
    'user:update': UserUpdateRequest;
    'user:batchPut': User[];
    'user:batchDelete': string[];
  }>();

  $: departments = $config && $config.success ? getDepartmentConfigs($config.result) : [];

  function getUsersByDepartment(department: string, users: Array<User>) {
    if (departments.map((dept) => dept.id).includes(department)) {
      return users.filter((user) => user.department === department);
    }
    return users.filter((user) => !departments.map((dept) => dept.id).includes(user.department));
  }

  export let users: Array<User>;

  let selectedTab: string;

  $: departmentUsers = selectedTab ? getUsersByDepartment(selectedTab, users) : [];

  export let updating = false;
  export let error = null;

  let userEditModalOpen = false;
  let editTargetUser: User;

  let uploadUserModalOpen = false;

  let batchDeleteModalOpen = false;
  let batchUnclaimModalOpen = false;

  let userExportModalOpen = false;

  let selectedUser: string[] = [];

  function addUser() {
    editTargetUser = null;
    userEditModalOpen = true;
  }

  function editUser(user: User) {
    editTargetUser = user;
    userEditModalOpen = true;
  }
  
  function updateUser(evt: CustomEvent<UserUpdateRequest>) {
    userEditModalOpen = false;
    editTargetUser = null;
    dispatch('user:update', evt.detail);
  }

  function openImportUserModal() {
    uploadUserModalOpen = true;
  }

  function openExportUserModal() {
    userExportModalOpen = true;
  }

  function importUser(evt: CustomEvent<{ overwrite: boolean; users: User[] }>) {
    uploadUserModalOpen = false;
    const data = evt.detail;
    const userKeys = users.map((u: User) => u.id);
    const putUsers = data.overwrite
      ? data.users
      : data.users.filter((u: User) => !userKeys.includes(u.id));
    dispatch('user:batchPut', putUsers);
  }

  function batchDeleteUser(ids: string[]) {
    batchDeleteModalOpen = false;
    dispatch('user:batchDelete', ids);
  }

  function batchUnclaimUser(ids: string[]) {
    batchUnclaimModalOpen = false;
    const targetUsers = users.filter((user) => ids.includes(user.id));
    const unclaimedTargetUsers = targetUsers.map((user) => {
      delete user.lockerId;
      delete user.claimedUntil;
      return user;
    });
    dispatch('user:batchPut', unclaimedTargetUsers);
  }

  // noinspection NonAsciiCharacters
  type ReadableUser = {
    학번: string;
    성명: string;
    '학과(부)': string;
    '관리자 여부': '예' | '아니오';
    '예약한 사물함'?: string;
    '사용 기한'?: string;
  };

  const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'short',
    hour12: false,
  });

  function generate(readableUsers: ReadableUser[]) {
    const workBook = utils.book_new();
    const workSheet = utils.json_to_sheet(readableUsers);
    utils.book_append_sheet(workBook, workSheet, '예약자 목록');
    const xlsx = writeXLSX(workBook, {
      type: 'array',
      bookType: 'xlsx',
    });
    const blob = URL.createObjectURL(new Blob([xlsx], { type: 'application/octet-stream' }));
    const link = document.createElement('a');
    link.href = blob;
    link.download = `예약자_목록_${dateFormatter.format(new Date())}.xlsx`.replace(' ', '_');
    link.click();
  }

  function exportUser(evt: CustomEvent<{ department: string; reservedOnly: boolean }>) {
    const { department, reservedOnly } = evt.detail;
    userExportModalOpen = false;
    // noinspection NonAsciiCharacters
    const readableUsers: ReadableUser[] = (users ?? [])
      .filter((u: User) => {
        return (
          (department === 'all' || department === u.department) &&
          (reservedOnly === false || u.lockerId)
        );
      })
      .map((u: User) => ({
        학번: u.id,
        성명: u.name,
        '학과(부)': departments.find((dept) => u.department === dept.id)?.name ?? '알 수 없음',
        '관리자 여부': u.isAdmin ? '예' : '아니오',
        ...(u.lockerId && { '예약한 사물함': u.lockerId ?? '없음' }),
        ...(u.claimedUntil && { '사용 기한': dateFormatter.format(u.claimedUntil as Date) }),
      }));
    generate(readableUsers);
  }
</script>

<div class="my-8 flex w-auto flex-col items-stretch gap-3 lg:mx-8">
  <div class="mx-6 flex w-full flex-wrap lg:mx-0">
    <h3>사용자 설정</h3>
    {#if !updating && !error}
      <div class="flex grow items-center justify-end gap-1">
        <Button on:click={addUser} class="bg-primary-800 text-white" isIconRight>
          사용자 추가
          <Add slot="icon" />
        </Button>
        <Button on:click={openImportUserModal} class="bg-primary-800 text-white" isIconRight>
          가져오기
          <PeopleTeamAdd slot="icon" />
        </Button>
        <Button on:click={openExportUserModal} class="bg-green-800 text-white" isIconRight>
          내보내기
          <DocumentTable slot="icon" />
        </Button>
      </div>
    {/if}
  </div>
  {#if !updating && !error}
    <div
      class="flex min-w-[640px] basis-[640px] flex-col gap-3 bg-white p-6 shadow-md lg:rounded-md">
      <TabGroup bind:selectedId={selectedTab}>
        {#each departments as department}
          <TabItem id={department.id}>{department.name}</TabItem>
        {/each}
        <!-- 존재하지 않는 학과(부)를 가진 사용자가 있을 경우 -->
        {#if users.filter((user) => !departments
              .map((dept) => dept.id)
              .includes(user.department)).length}
          <TabItem id="unknown">알 수 없음</TabItem>
        {/if}
      </TabGroup>
      <UserDatatable
        on:batchDelete={() => (batchDeleteModalOpen = true)}
        on:batchUnclaim={() => (batchUnclaimModalOpen = true)}
        on:edit={(evt) => editUser(evt.detail)}
        users={departmentUsers}
        bind:selected={selectedUser} />
    </div>
  {:else if updating}
    <UpdateScreen class="min-h-[360px] lg:rounded-md" />
  {:else if error}
    <ErrorScreen class="min-h-[360px] lg:rounded-md" />
  {/if}
</div>

<UserEditModal
  targetUser={editTargetUser}
  bind:open={userEditModalOpen}
  on:close={() => (userEditModalOpen = false)}
  on:submit={updateUser} />
<UserImportModal
  bind:open={uploadUserModalOpen}
  on:close={() => (uploadUserModalOpen = false)}
  on:submit={importUser} />

<UserExportModal
  bind:open={userExportModalOpen}
  on:close={() => (userExportModalOpen = false)}
  on:submit={exportUser}
  {users} />

<Modal
  bind:open={batchDeleteModalOpen}
  title="일괄 삭제"
  on:close={() => (batchDeleteModalOpen = false)}
  on:click:secondary={() => (batchDeleteModalOpen = false)}
  on:click={() => batchDeleteUser(selectedUser)}>
  <p>
    선택된 <span class="font-bold">{selectedUser.length}</span>명의 사용자를 일괄 삭제하시겠습니까?
  </p>
  <p class="font-bold text-red-800">주의! 이 작업은 되돌릴 수 없습니다.</p>
  <PeopleTeamDelete slot="primaryIcon" />
  <Dismiss slot="secondaryIcon" />
</Modal>
<Modal
  bind:open={batchUnclaimModalOpen}
  title="일괄 예약 취소"
  on:close={() => (batchUnclaimModalOpen = false)}
  on:click:secondary={() => (batchUnclaimModalOpen = false)}
  on:click={() => batchUnclaimUser(selectedUser)}>
  <p>
    선택된 <span class="font-bold">{selectedUser.length}</span>명의 사용자 사물함을
    취소하시겠습니까?
  </p>
  <p class="font-bold">주의! 이 작업은 되돌릴 수 없습니다.</p>
  <p class="text-lg font-bold text-red-800">
    경고! 이 작업을 예약 시간 중 진행하면 사용자가 로그아웃 될 수 있습니다!!
  </p>
  <DocumentHeaderRemove slot="primaryIcon" />
  <Dismiss slot="secondaryIcon" />
</Modal>
