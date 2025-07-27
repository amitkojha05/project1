"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import { useForm } from "react-hook-form"
import { ArrowLeft, Plus, Edit, Trash2, Calendar, CheckSquare, Clock, AlertCircle, User } from "lucide-react"
import toast from "react-hot-toast"

const ProjectDetail = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm()

  useEffect(() => {
    fetchProjectDetails()
  }, [id])

  const fetchProjectDetails = async () => {
    try {
      setLoading(true)

      // Fetch project details
      const projectResponse = await axios.get(`/projects/${id}`)
      setProject(projectResponse.data.project)

      // Fetch project tasks
      const tasksResponse = await axios.get(`/tasks/project/${id}`)
      setTasks(tasksResponse.data.tasks)
    } catch (error) {
      console.error("Error fetching project details:", error)
      if (error.response?.status === 404) {
        toast.error("Project not found")
        navigate("/projects")
      } else {
        toast.error("Failed to load project details")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (data) => {
    try {
      await axios.post(`/tasks/project/${id}`, {
        ...data,
        due_date: data.due_date || null,
      })
      toast.success("Task created successfully")
      setShowCreateTaskModal(false)
      reset()
      fetchProjectDetails()
    } catch (error) {
      console.error("Error creating task:", error)
      toast.error(error.response?.data?.error || "Failed to create task")
    }
  }

  const handleUpdateTask = async (data) => {
    try {
      await axios.put(`/tasks/${editingTask.id}`, {
        ...data,
        due_date: data.due_date || null,
      })
      toast.success("Task updated successfully")
      setEditingTask(null)
      reset()
      fetchProjectDetails()
    } catch (error) {
      console.error("Error updating task:", error)
      toast.error(error.response?.data?.error || "Failed to update task")
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`/tasks/${taskId}`)
      toast.success("Task deleted successfully")
      setDeleteConfirm(null)
      fetchProjectDetails()
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error(error.response?.data?.error || "Failed to delete task")
    }
  }

  const openEditTaskModal = (task) => {
    setEditingTask(task)
    setValue("title", task.title)
    setValue("description", task.description)
    setValue("status", task.status)
    setValue("priority", task.priority)
    setValue("due_date", task.due_date ? task.due_date.split("T")[0] : "")
  }

  const closeModals = () => {
    setShowCreateTaskModal(false)
    setEditingTask(null)
    setDeleteConfirm(null)
    reset()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "todo":
        return "bg-yellow-100 text-yellow-800"
      case "active":
        return "bg-green-100 text-green-800"
      case "on_hold":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4" />
      case "medium":
        return <Clock className="h-4 w-4" />
      case "low":
        return <CheckSquare className="h-4 w-4" />
      default:
        return <CheckSquare className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Project not found</h3>
        <Link to="/projects" className="btn btn-primary btn-md mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Link>
      </div>
    )
  }

  const completedTasks = tasks.filter((task) => task.status === "completed").length
  const totalTasks = tasks.length
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/projects" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500">Created on {new Date(project.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {user?.role === "admin" && (
          <button onClick={() => setShowCreateTaskModal(true)} className="btn btn-primary btn-md">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </button>
        )}
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Project Details</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{project.description || "No description provided"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span
                      className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                    >
                      {project.status.replace("_", " ")}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created By</label>
                    <div className="mt-1 flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{project.created_by_email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Progress</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Completion</span>
                    <span>{completionPercentage}%</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{totalTasks}</div>
                    <div className="text-sm text-gray-500">Total Tasks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Tasks</h3>
        </div>
        <div className="card-content">
          {tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}
                        >
                          {getPriorityIcon(task.priority)}
                          <span className="ml-1">{task.priority}</span>
                        </span>
                      </div>

                      {task.description && <p className="text-sm text-gray-600 mb-2">{task.description}</p>}

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          <span>{task.created_by_email}</span>
                        </div>
                        {task.due_date && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {user?.role === "admin" && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => openEditTaskModal(task)}
                          className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(task)}
                          className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new task for this project.</p>
              {user?.role === "admin" && (
                <div className="mt-6">
                  <button onClick={() => setShowCreateTaskModal(true)} className="btn btn-primary btn-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Task Modal */}
      {(showCreateTaskModal || editingTask) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTask ? "Edit Task" : "Create New Task"}
              </h3>

              <form onSubmit={handleSubmit(editingTask ? handleUpdateTask : handleCreateTask)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
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

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={closeModals} className="btn btn-outline btn-md">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-md">
                    {editingTask ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Task</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-4">
                <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline btn-md">
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTask(deleteConfirm.id)}
                  className="btn btn-md bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDetail
