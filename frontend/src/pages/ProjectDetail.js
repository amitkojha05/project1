"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import axios from "axios"
import toast from "react-hot-toast"
import { useAuth } from "../contexts/AuthContext"
import { ArrowLeft, Plus, Edit, Trash2, CheckSquare, Calendar, Flag } from "lucide-react"

const ProjectDetail = () => {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    fetchProjectData()
  }, [id])

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        axios.get(`/projects/${id}`),
        axios.get(`/tasks/project/${id}`),
      ])
      setProject(projectRes.data.project)
      setTasks(tasksRes.data.tasks)
    } catch (error) {
      toast.error("Failed to fetch project data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = () => {
    setEditingTask(null)
    reset({ status: "todo", priority: "medium" })
    setShowModal(true)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    reset(task)
    setShowModal(true)
  }

  const onSubmit = async (data) => {
    try {
      if (editingTask) {
        await axios.put(`/tasks/${editingTask.id}`, data)
        toast.success("Task updated successfully")
      } else {
        await axios.post(`/tasks/project/${id}`, data)
        toast.success("Task created successfully")
      }
      setShowModal(false)
      fetchProjectData()
    } catch (error) {
      toast.error(error.response?.data?.error || "Operation failed")
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.delete(`/tasks/${taskId}`)
        toast.success("Task deleted successfully")
        fetchProjectData()
      } catch (error) {
        toast.error("Failed to delete task")
      }
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      todo: "badge-outline",
      in_progress: "badge-default",
      completed: "badge-secondary",
    }
    return badges[status] || "badge-outline"
  }

  const getPriorityBadge = (priority) => {
    const badges = {
      low: "badge-secondary",
      medium: "badge-default",
      high: "badge-destructive",
    }
    return badges[priority] || "badge-outline"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
        <Link to="/projects" className="text-blue-600 hover:text-blue-500">
          Back to Projects
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/projects" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600">{project.description}</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={handleCreateTask} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </button>
        )}
      </div>

      {/* Project Info */}
      <div className="card">
        <div className="card-content p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <span className={`badge ${getStatusBadge(project.status)} mt-1`}>{project.status.replace("_", " ")}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-sm text-gray-900 mt-1">{new Date(project.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-sm text-gray-900 mt-1">{new Date(project.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
            <span className="text-sm text-gray-500">{tasks.length} tasks</span>
          </div>
        </div>
        <div className="card-content">
          {tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <CheckSquare className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`badge ${getStatusBadge(task.status)}`}>{task.status.replace("_", " ")}</span>
                        <span className={`badge ${getPriorityBadge(task.priority)}`}>
                          <Flag className="h-3 w-3 mr-1" />
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditTask(task)} className="text-gray-400 hover:text-blue-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-600 mb-4">Add tasks to track project progress</p>
              {isAdmin && (
                <button onClick={handleCreateTask} className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowModal(false)}
            />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingTask ? "Edit Task" : "Create New Task"}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Task Title</label>
                      <input
                        {...register("title", { required: "Task title is required" })}
                        type="text"
                        className="input mt-1"
                        placeholder="Enter task title"
                      />
                      {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        {...register("description")}
                        rows={3}
                        className="input mt-1"
                        placeholder="Enter task description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select {...register("status")} className="input mt-1">
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Priority</label>
                        <select {...register("priority")} className="input mt-1">
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Due Date</label>
                      <input {...register("due_date")} type="date" className="input mt-1" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="btn-primary w-full sm:w-auto sm:ml-3">
                    {editingTask ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-outline w-full sm:w-auto mt-3 sm:mt-0"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetail
