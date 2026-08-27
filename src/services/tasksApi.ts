import { getAccessToken } from './auth';

export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated?: string;
  position?: string;
}

async function requestWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in with Google to access Google Tasks.');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Google Tasks session expired or unauthorized. Please re-authenticate.');
    }
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Google Tasks API error: ${response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// 1. Get all task lists
export async function getTaskLists(): Promise<GoogleTaskList[]> {
  const data = await requestWithAuth('https://tasks.googleapis.com/tasks/v1/users/@me/lists');
  return data.items || [];
}

// 2. Create a new task list
export async function createTaskList(title: string): Promise<GoogleTaskList> {
  return requestWithAuth('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

// 3. Delete a task list
export async function deleteTaskList(taskListId: string): Promise<void> {
  await requestWithAuth(`https://tasks.googleapis.com/tasks/v1/users/@me/lists/${taskListId}`, {
    method: 'DELETE',
  });
}

// 4. Get tasks in a list
export async function getTasks(taskListId: string): Promise<GoogleTask[]> {
  const data = await requestWithAuth(
    `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&showHidden=true`
  );
  return data.items || [];
}

// 5. Create a new task
export async function createTask(
  taskListId: string,
  task: { title: string; notes?: string; due?: string }
): Promise<GoogleTask> {
  return requestWithAuth(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

// 6. Update task status (toggle complete or edit)
export async function updateTask(
  taskListId: string,
  taskId: string,
  patch: Partial<GoogleTask>
): Promise<GoogleTask> {
  return requestWithAuth(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

// 7. Delete task
export async function deleteTask(taskListId: string, taskId: string): Promise<void> {
  await requestWithAuth(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

// 8. Clear completed tasks
export async function clearCompletedTasks(taskListId: string): Promise<void> {
  await requestWithAuth(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/clear`, {
    method: 'POST',
  });
}
