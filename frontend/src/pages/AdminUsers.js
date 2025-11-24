import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import "./AdminUsers.css";

const API_URL = "http://localhost:5000/api/admin/users";

export default function AdminUsers() {
  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem("user"));
  } catch {
    storedUser = null;
  }

  const currentAdmin = storedUser || {
    id: "dummy",
    role: "globaladmin",
    postalCode: "509001",
  };

  // STATE
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        setError("Failed to fetch users");
      }
    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockStatus = async (id, status) => {
    const action = status === "ACTIVE" ? "Block" : "Unblock";
    const result = await Swal.fire({
      title: `${action} User?`,
      text: `Are you sure you want to ${action.toLowerCase()} this user?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#dc2626",
      confirmButtonText: action,
      background: "#fff",
      color: "#333",
    });

    if (!result.isConfirmed) return;

    setUsers((prev) =>
      prev.map((u) =>
        u._id === id
          ? { ...u, status: status === "ACTIVE" ? "BLOCKED" : "ACTIVE" }
          : u
      )
    );

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/block/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          title: "Updated!",
          text: `User has been ${action}ed.`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        fetchUsers();
      }
    } catch (err) {
      fetchUsers();
    }
  };

  const toggleRole = async (id, currentRole) => {
    if (currentAdmin.role !== "globaladmin") return;

    const newRole = currentRole === "user" ? "admin" : "user";
    const result = await Swal.fire({
      title: "Change Role?",
      text: `Promote this user to ${newRole}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      confirmButtonText: "Yes, promote",
    });

    if (!result.isConfirmed) return;

    setUsers((prev) =>
      prev.map((u) => (u._id === id ? { ...u, role: newRole } : u))
    );

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/role/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({
        title: "Success!",
        text: `Role updated to ${newRole}`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      fetchUsers();
    }
  };

  const deleteUser = async (id) => {
    const result = await Swal.fire({
      title: "Delete User?",
      text: "This action is permanent.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    setUsers((prev) => prev.filter((u) => u._id !== id));

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({
        title: "Deleted!",
        text: "User removed.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      fetchUsers();
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.postalCode.includes(searchTerm);

      if (!matchesSearch) return false;

      if (currentAdmin.role === "globaladmin") {
        if (activeTab === "users") return user.role === "user";
        if (activeTab === "admins") return user.role === "admin";
      } else if (currentAdmin.role === "admin") {
        return (
          user.role === "user" && user.postalCode === currentAdmin.postalCode
        );
      }
      return false;
    });
  }, [users, searchTerm, activeTab, currentAdmin]);

  return (
    <div className="users-wrapper">
      <div className="header-container">
        <div>
          <h1 className="page-title">
            {currentAdmin.role === "globaladmin"
              ? "Admin Dashboard"
              : "Region Manager"}
          </h1>
          <p className="page-subtitle">
            {currentAdmin.role === "globaladmin"
              ? "Manage all users and administrators across the platform."
              : `Managing Postal Code: ${currentAdmin.postalCode}`}
          </p>
        </div>

        {/* Right Side: Tabs & Search */}
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          {currentAdmin.role === "globaladmin" && (
            <div className="tabs-container">
              <button
                className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
                onClick={() => setActiveTab("users")}
              >
                Users
              </button>
              <button
                className={`tab-btn ${activeTab === "admins" ? "active" : ""}`}
                onClick={() => setActiveTab("admins")}
              >
                Admins
              </button>
            </div>
          )}

          <div className="search-container">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              placeholder="Search users..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="user-card">
        {loading ? (
          <div className="loader-container">
            <div className="spinner"></div>
            <p>Loading Data...</p>
          </div>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>User Details</th>
                {currentAdmin.role === "globaladmin" && <th>Role</th>}
                <th>Postal Code</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#fff",
                    }}
                  >
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info">
                        <span className="user-name">{user.name}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </td>

                    {currentAdmin.role === "globaladmin" && (
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                    )}

                    <td style={{ fontWeight: "500", color: "#475569" }}>
                      {user.postalCode}
                    </td>

                    <td>
                      <div
                        className={`status-dot-container ${
                          user.status === "ACTIVE" ? "active" : "blocked"
                        }`}
                      >
                        <div className="status-dot"></div>
                        {user.status}
                      </div>
                    </td>

                    <td className="actions-col">
                      <button
                        className={`actions-btn ${
                          user.status === "ACTIVE" ? "block-btn" : "unblock-btn"
                        }`}
                        onClick={() => toggleBlockStatus(user._id, user.status)}
                        title={
                          user.status === "ACTIVE"
                            ? "Block User"
                            : "Unblock User"
                        }
                      >
                        {user.status === "ACTIVE" ? (
                          <i className="bi bi-lock-fill"></i>
                        ) : (
                          <i className="bi bi-unlock-fill"></i>
                        )}
                      </button>

                      {currentAdmin.role === "globaladmin" && (
                        <button
                          className="actions-btn promote-btn"
                          onClick={() => toggleRole(user._id, user.role)}
                          title="Change Role"
                        >
                          <i className="bi bi-arrow-up-circle-fill"></i>
                        </button>
                      )}

                      <button
                        className="actions-btn delete-btn"
                        onClick={() => deleteUser(user._id)}
                        title="Delete User"
                      >
                        <i className="bi bi-trash3-fill"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
