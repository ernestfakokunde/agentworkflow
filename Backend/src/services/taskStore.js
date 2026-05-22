export function createTaskStore() {
  const tasks = new Map()

  return {
    addTask(task) {
      tasks.set(task.id, task)
      console.log(`✓ Task created: ${task.id}`)
    },

    getTask(taskId) {
      return tasks.get(taskId)
    },

    updateTask(task) {
      tasks.set(task.id, task)
      console.log(`✓ Task updated: ${task.id} - ${task.status}`)
    },

    getAllTasks() {
      return Array.from(tasks.values())
    },

    deleteTask(taskId) {
      tasks.delete(taskId)
    }
  }
}
