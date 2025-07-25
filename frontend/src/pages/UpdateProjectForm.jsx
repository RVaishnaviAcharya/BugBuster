import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import MultiSelect from '@/components/MultiSelect'

import { apiClient } from '@/lib/axios.js'
import {
    GET_DEVELOPERS_AND_TESTERS_ROUTE,
    UPDATE_PROJECT_ROUTE,
    GET_PROJECT_BY_ID_ROUTE
} from '@/lib/routes'
import { useAppStore } from '@/store/store'
import { useParams } from 'react-router-dom'
import { checkGithubConnection } from '@/lib/VersionControl-Integration/versioncontrol'

function UpdateProjectForm() {
    const params = useParams();
    const projectId = params.projectId;

    const { token } = useAppStore()
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        githubLink: '',
        githubToken: '',
        teamMembers: [],
    })

    const [loading, setLoading] = useState(false)
    const [userOptions, setUserOptions] = useState([])
    const [usersLoading, setUsersLoading] = useState(true)

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await apiClient.get(GET_DEVELOPERS_AND_TESTERS_ROUTE)
                const options = res.data.map(user => ({
                    label: user.name,
                    value: user.id,
                }))
                setUserOptions(options)
            } catch (err) {
                console.error(err)
                toast.error('Failed to load team members')
            } finally {
                setUsersLoading(false)
            }
        }

        fetchUsers()
    }, [])

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await apiClient.get(`${GET_PROJECT_BY_ID_ROUTE}/${projectId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const project = res.data
                setFormData({
                    name: project.name,
                    description: project.description,
                    githubLink: project.githubLink,
                    githubToken: project.githubToken,
                    teamMembers: project.teamMembers,
                })
            } catch (err) {
                console.error(err)
                toast.error('Failed to fetch project details')
            }
        }

        if (projectId) fetchProject()
    }, [projectId, token])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSelection = (values) => {
        setFormData(prev => ({ ...prev, teamMembers: values }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name || !formData.description || !formData.githubLink || !formData.githubToken) {
            toast.error("All fields are required")
            return
        }

        if (formData.teamMembers.length === 0) {
            toast.error("Please select at least one team member")
            return
        }

        try {
            setLoading(true)

            await checkGithubConnection(formData.githubToken , formData.githubLink);

            await apiClient.put(`${UPDATE_PROJECT_ROUTE}/${projectId}`, {
                name: formData.name,
                description: formData.description,
                githubLink: formData.githubLink,
                githubToken: formData.githubToken,
                teamMembers: formData.teamMembers,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success("Project updated successfully!")
        } catch (err) {
            console.error(err)
            toast.error(err.response?.data?.message || 'Failed to update project')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="p-4 md:p-8 lg:p-12 flex flex-col gap-6 bg-background">
            <div className="bg-card border border-border shadow-sm rounded-xl p-6 dark:bg-sidebar">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-2">Update Project</h1>
                    <p className="text-muted-foreground mb-4">
                        Modify the project details and update below.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Project name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={5}
                            placeholder="Describe the project in detail..."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="githubLink">GitHub Repository Link</Label>
                        <Input
                            id="githubLink"
                            name="githubLink"
                            value={formData.githubLink}
                            onChange={handleChange}
                            placeholder="Project GitHub repository link"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="githubToken">GitHub Token</Label>
                        <Input
                            id="githubToken"
                            name="githubToken"
                            value={formData.githubToken}
                            onChange={handleChange}
                            placeholder="GitHub token"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Add Team Members</Label>
                        <MultiSelect
                            options={userOptions}
                            value={formData.teamMembers}
                            onChange={handleSelection}
                            placeholder={usersLoading ? "Loading team members..." : "Select team members"}
                            disabled={usersLoading}
                        />
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                            {loading ? "Updating..." : "Update Project"}
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    )
}

export default UpdateProjectForm
