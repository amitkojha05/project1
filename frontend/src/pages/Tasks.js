"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import { Search, CheckSquare, Calendar, User, Clock, AlertCircle, FolderOpen } from "lucide-react"
import toast from "react-hot-toast"

const Tasks = () => {
  const { user } = useAuth()
  const [allTasks, setAllTasks] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [projectFilter, setProjectFilter] = useState("all")

  useEffect(() => {
    fetchTasksAndProjects()
  }, [])

  useEffect(() => {
    filterTasks()
  }, [allTasks, searchTerm, statusFilter, priorityFilter, projectFilter])

  const fetchTasksAndProjects = async () => {
    try {
      setLoading(true)

      // Fetch projects first
      const projectsResponse = await axios.get("/projects")
      const projectsData = projectsResponse.data.projects
      setProjects(projectsData)

      // Fetch all tasks for all projects
      let allTasksData = []
      for (const project of projectsData) {
        try {
          const tasksResponse = await axios.get(`/tasks/project/${project.id}`)
          const projectTasks = tasksResponse.data.tasks.map((task) => ({
            ...task,
            project_name: project.name,
            project_id: project.id,
          }))
          allTasksData = [...allTasksData, ...projectTasks]
        } catch (error) {
          console.error(`Error fetching tasks for project ${project.id}:`, error)
        }
      }

      setAllTasks(allTasksData)
    } catch (error) {
      console.error("Error fetching tasks and projects:", error)
      toast.error("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  const filterTasks = () => {
    let filtered = allTasks

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.project_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    // Project filter
    if (projectFilter !== "all") {
      filtered = filtered.filter((task) => task.project_id.toString() === projectFilter)
    }

    setFilteredTasks(filtered)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "todo":
        return "bg-yellow-100 text-yellow-800"
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

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">All Tasks</h2>
          <p className="mt-1 text-sm text-gray-500">View and manage tasks across all your projects.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="lg:col-span-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="input pl-10"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input">
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Project Filter */}
        <div>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="input">
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id.toString()}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="card">
              <div className="card-content">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                      >
                        {getPriorityIcon(task.priority)}
                        <span className="ml-1">{task.priority}</span>
                      </span>
                      {task.due_date && isOverdue(task.due_date) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Overdue
                        </span>
                      )}
                    </div>

                    {task.description && <p className="text-sm text-gray-600 mb-3">{task.description}</p>}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <FolderOpen className="h-4 w-4 mr-1" />
                        <Link to={`/projects/${task.project_id}`} className="hover:text-primary-600">
                          {task.project_name}
                        </Link>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>{task.created_by_email}</span>
                      </div>
                      {task.due_date && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className={isOverdue(task.due_date) ? "text-red-600" : ""}>
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    <Link to={`/projects/${task.project_id}`} className="btn btn-outline btn-sm">
                      View Project
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || projectFilter !== "all"
              ? "Try adjusting your filters to see more tasks."
              : "Create some projects and add tasks to get started."}
          </p>
          {!searchTerm && statusFilter === "all" && priorityFilter === "all" && projectFilter === "all" && (
            <div className="mt-6">
              <Link to="/projects" className="btn btn-primary btn-md">
                <FolderOpen className="h-4 w-4 mr-2" />
                View Projects
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Tasks
