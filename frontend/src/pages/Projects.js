"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import axios from "axios"
import toast from "react-hot-toast"
import { useAuth } from "../contexts/AuthContext"
import { Plus, Edit, Trash2, FolderOpen, Calendar } from "lucide-react"

const Projects = () => {
  const { isAdmin } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await axios.get("/projects")
      setProjects(response.data.projects)
    } catch (error) {
      toast.error("Failed to fetch projects")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = () => {
    setEditingProject(null)
    reset()
    setShowModal(true)
  }

  const handleEditProject = (project) => {
    setEditingProject(project)
    reset(project)
    setShowModal(true)
  }

  const onSubmit = async (data) => {
    try {
      if (editingProject) {
        await axios.put(`/projects/${editingProject.id}`, data)
        toast.success("Project updated successfully")
      } else {
        await axios.post("/projects", data)
        toast.success("Project created successfully")
      }
      setShowModal(false)
      fetchProjects()
    } catch (error) {
      toast.error(error.response?.data?.error || "Operation failed")
    }
  }

  const handleDeleteProject = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await axios.delete(`/projects/${id}`)
        toast.success("Project deleted successfully")
        fetchProjects()
      } catch (error) {
        toast.error("Failed to delete project")
      }
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: "badge-default",
      completed: "badge-secondary",
      on_hold: "badge-outline",
    }
    return badges[status] || "badge-outline"
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
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage your projects and track progress</p>
        </div>
        {isAdmin && (
          <button onClick={handleCreateProject} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </button>
        )}
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="card">
              <div className="card-content p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <FolderOpen className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <span className={`badge ${getStatusBadge(project.status)} mt-1`}>
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditProject(project)} className="text-gray-400 hover:text-blue-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{project.description || "No description provided"}</p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  <Link to={`/projects/${project.id}`} className="text-blue-600 hover:text-blue-500 font-medium">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first project</p>
          {isAdmin && (
            <button onClick={handleCreateProject} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </button>
          )}
        </div>
      )}

      {/* Modal */}
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
                    {editingProject ? "Edit Project" : "Create New Project"}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Project Name</label>
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
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="btn-primary w-full sm:w-auto sm:ml-3">
                    {editingProject ? "Update" : "Create"}
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

export default Projects
