"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import toast from "react-hot-toast"
import { useAuth } from "../contexts/AuthContext"
import { CheckSquare, Calendar, Flag, FolderOpen, Filter } from "lucide-react"

const Tasks = () => {
  const { isAdmin } = useAuth()
  const [projects, setProjects] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    project: "all",
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [allTasks, filters])

  const fetchData = async () => {
    try {
      const projectsRes = await axios.get("/projects")
      const projects = projectsRes.data.projects
      setProjects(projects)

      // Fetch tasks for all projects
      const taskPromises = projects.map((project) => axios.get(`/tasks/project/${project.id}`))

      const taskResponses = await Promise.all(taskPromises)
      const allTasks = taskResponses.flatMap((response, index) =>
        response.data.tasks.map((task) => ({
          ...task,
          project_name: projects[index].name,
        })),
      )

      setAllTasks(allTasks)
    } catch (error) {
      toast.error("Failed to fetch tasks")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...allTasks]

    if (filters.status !== "all") {
      filtered = filtered.filter((task) => task.status === filters.status)
    }

    if (filters.priority !== "all") {
      filtered = filtered.filter((task) => task.priority === filters.priority)
    }

    if (filters.project !== "all") {
      filtered = filtered.filter((task) => task.project_id === Number.parseInt(filters.project))
    }

    setFilteredTasks(filtered)
  }

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }))
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

  const getStatusIcon = (status) => {
    return status === "completed" ? "✓" : status === "in_progress" ? "⏳" : "○"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tasks</h1>
          <p className="text-gray-600">View and manage tasks across all projects</p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredTasks.length} of {allTasks.length} tasks
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content p-4">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="text-sm border-gray-300 rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange("priority", e.target.value)}
                  className="text-sm border-gray-300 rounded-md"
                >
                  <option value="all">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Project</label>
                <select
                  value={filters.project}
                  onChange={(e) => handleFilterChange("project", e.target.value)}
                  className="text-sm border-gray-300 rounded-md"
                >
                  <option value="all">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="card">
              <div className="card-content p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">{getStatusIcon(task.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        <span className={`badge ${getStatusBadge(task.status)}`}>{task.status.replace("_", " ")}</span>
                        <span className={`badge ${getPriorityBadge(task.priority)}`}>
                          <Flag className="h-3 w-3 mr-1" />
                          {task.priority}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3">{task.description}</p>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <FolderOpen className="h-4 w-4 mr-1" />
                          {task.project_name}
                        </div>
                        {task.due_date && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                        <div>Created: {new Date(task.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600">
            {allTasks.length === 0 ? "No tasks have been created yet" : "Try adjusting your filters to see more tasks"}
          </p>
        </div>
      )}
    </div>
  )
}

export default Tasks
