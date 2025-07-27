"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import { useForm } from "react-hook-form"
import { Plus, Search, FolderOpen, Edit, Trash2, Eye, Calendar, CheckSquare } from "lucide-react"
import toast from "react-hot-toast"

const Projects = () => {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/projects")
      setProjects(response.data.projects)
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast.error("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (data) => {
    try {
      await axios.post("/projects", data)
      toast.success("Project created successfully")
      setShowCreateModal(false)
      reset()
      fetchProjects()
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error(error.response?.data?.error || "Failed to create project")
    }
  }

  const handleUpdateProject = async (data) => {
    try {
      await axios.put(`/projects/${editingProject.id}`, data)
      toast.success("Project updated successfully")
      setEditingProject(null)
      reset()
      fetchProjects()
    } catch (error) {
      console.error("Error updating project:", error)
      toast.error(error.response?.data?.error || "Failed to update project")
    }
  }

  const handleDeleteProject = async (projectId) => {
    try {
      await axios.delete(`/projects/${projectId}`)
      toast.success("Project deleted successfully")
      setDeleteConfirm(null)
      fetchProjects()
    } catch (error) {
      console.error("Error deleting project:", error)
      toast.error(error.response?.data?.error || "Failed to delete project")
    }
  }

  const openEditModal = (project) => {
    setEditingProject(project)
    setValue("name", project.name)
    setValue("description", project.description)
    setValue("status", project.status)
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setEditingProject(null)
    setDeleteConfirm(null)
    reset()
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "on_hold":
        return "bg-red-100 text-red-800"
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
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Projects</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your projects and track their progress.</p>
        </div>
        {user?.role === "admin" && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-md">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <div key={project.id} className="card">
              <div className="card-content">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FolderOpen className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900 truncate">{project.name}</h3>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                  >
                    {project.status.replace("_", " ")}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {project.description || "No description provided"}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <CheckSquare className="h-4 w-4 mr-1" />
                    <span>{project.task_count || 0} tasks</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Link to={`/projects/${project.id}`} className="btn btn-outline btn-sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>

                  {user?.role === "admin" && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(project)}
                        className="btn btn-ghost btn-sm text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(project)}
                        className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? "No projects match your search." : "Get started by creating a new project."}
          </p>
          {user?.role === "admin" && !searchTerm && (
            <div className="mt-6">
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-md">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingProject) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingProject ? "Edit Project" : "Create New Project"}
              </h3>

              <form
                onSubmit={handleSubmit(editingProject ? handleUpdateProject : handleCreateProject)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    {...register("name", { required: "Project name is required" })}
                    type="text"
                    className="input mt-1"
                    placeholder="Enter project name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    className="input mt-1"
                    placeholder="Enter project description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select {...register("status")} className="input mt-1">
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={closeModals} className="btn btn-outline btn-md">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-md">
                    {editingProject ? "Update" : "Create"}
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
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Project</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone and will also
                  delete all associated tasks.
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-4">
                <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline btn-md">
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProject(deleteConfirm.id)}
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

export default Projects
