
// Fix for line 323 - changing the comparison operator for status change
// Only updating the problematic part

const handleTaskStatusChange = (taskId: string, status: TaskStatus) => {
  setTasks((prevTasks) => 
    prevTasks.map((task) => {
      if (task.id === taskId) {
        const updatedTask = { 
          ...task, 
          status,
          // Set completedDate if status is completed, otherwise remove it
          completedDate: status === "completed" ? new Date().toISOString() : undefined
        };
        return updatedTask;
      }
      return task;
    })
  );
};
