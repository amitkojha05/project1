"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import { FolderOpen, CheckSquare, Clock, TrendingUp, Plus, Calendar } from "lucide-react"
import toast from "react-hot-toast"

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  })
  const [recentProjects, setRecentProjects] = useState([])
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch projects
      const projectsResponse = await axios.get("/projects")
      const projects = projectsResponse.data.projects

      // Fetch all tasks for stats
      let allTasks = []
      for (const project of projects) {
        try {
          const tasksResponse = await axios.get(`/tasks/project/${project.id}`)
          allTasks = [...allTasks, ...tasksResponse.data.tasks]
        } catch (error) {
          console.error(`Error fetching tasks for project ${project.id}:`, error)
        }
      }

      // Calculate stats
      const completedTasks = allTasks.filter((task) => task.status === "completed").length
      const pendingTasks = allTasks.filter((task) => task.status !== "completed").length

      setStats({
        totalProjects: projects.length,
        totalTasks: allTasks.length,
        completedTasks,
        pendingTasks,
      })

      // Set recent projects (last 5)
      setRecentProjects(projects.slice(0, 5))

      // Set recent tasks (last 5)
      setRecentTasks(allTasks.slice(0, 5))
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
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
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Welcome back, {user?.email}
          </h2>
          <p className="mt-1 text-sm text-gray-500">Here's what's happening with your projects today.</p>
        </div>
        {user?.role === "admin" && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link to="/projects" className="btn btn-primary btn-md">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderOpen className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalProjects}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Tasks</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.completedTasks}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Tasks</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingTasks}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalTasks}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects and Tasks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Projects</h3>
            <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          <div className="card-content">
            {recentProjects.length > 0 ? (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600"
                      >
                        {project.name}
                      </Link>
                      <p className="text-sm text-gray-500 truncate">{project.description || "No description"}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                      >
                        {project.status}
                      </span>
                      <span className="text-xs text-gray-500">{project.task_count} tasks</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No projects yet.</p>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Tasks</h3>
            <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          <div className="card-content">
            {recentTasks.length > 0 ? (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-500 truncate">{task.description || "No description"}</p>
                      {task.due_date && (
                        <div className="flex items-center mt-1">
                          <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No tasks yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
