import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Swal from "sweetalert2";
import "./ViewComplaints.css";

// Placeholder for date-fns
const formatDistanceToNow = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " years ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " months ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + " days ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " hours ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " minutes ago";
  return "just now";
};

const BACKEND = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ViewComplaints = () => {
  const { user } = useAuth();
  const [myAreaReports, setMyAreaReports] = useState([]);
  const [otherReports, setOtherReports] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedComplaintForComments, setSelectedComplaintForComments] =
    useState(null);
  const [commentsLocal, setCommentsLocal] = useState({});
  const [newComment, setNewComment] = useState("");
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const userId = user?._id || user?.id;
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const updateIssueInState = (updatedIssue) => {
    if (!updatedIssue) return;

    const id = updatedIssue._id || updatedIssue.id;

    setMyAreaReports((prev) =>
      prev.map((i) => ((i._id || i.id) === id ? updatedIssue : i))
    );
    setOtherReports((prev) =>
      prev.map((i) => ((i._id || i.id) === id ? updatedIssue : i))
    );

    setCommentsLocal((prev) => ({
      ...prev,
      [id]: updatedIssue.comments || [],
    }));

    if (
      selectedComplaint &&
      (selectedComplaint._id || selectedComplaint.id) === id
    ) {
      setSelectedComplaint(updatedIssue);
    }
    if (
      selectedComplaintForComments &&
      (selectedComplaintForComments._id || selectedComplaintForComments.id) ===
        id
    ) {
      setSelectedComplaintForComments(updatedIssue);
    }
  };

  const fetchComments = async (issueId, pageNum = 1) => {
    if (loading) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${BACKEND}/api/issues/${issueId}/comments?page=${pageNum}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (pageNum === 1) setComments(res.data.comments);
      else setComments((prev) => [...prev, ...res.data.comments]);

      setTotalPages(res.data.totalPages);
      setHasMore(pageNum < res.data.totalPages);
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const handleScroll = () => {
      const modalBox = document.querySelector(".comments-list");
      if (!modalBox || loading || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = modalBox;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setPage((prev) => {
          const next = prev + 1;
          fetchComments(selectedComplaintForComments._id, next);
          return next;
        });
      }
    };

    const modalBox = document.querySelector(".comments-list");
    if (modalBox) modalBox.addEventListener("scroll", handleScroll);

    return () => {
      if (modalBox) modalBox.removeEventListener("scroll", handleScroll);
    };
  }, [loading, hasMore, selectedComplaintForComments]);

  const fetchComplaints = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BACKEND}/api/issues`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        const myArea = res.data.localIssues || [];
        const others = res.data.otherIssues || [];

        setMyAreaReports(myArea);
        setOtherReports(others);
        const map = {};
        [...myArea, ...others].forEach((issue) => {
          const id = issue._id || issue.id;
          map[id] = issue.comments || [];
        });
        setCommentsLocal(map);
      } else {
        const issues = res.data.issues || res.data || [];
        const my = [];
        const other = [];
        const userPostal = (user?.postalCode || "").toString().trim();

        issues.forEach((issue) => {
          const ip = (issue.postalCode || "").toString().trim();

          if (userPostal && ip && ip === userPostal) my.push(issue);
          else other.push(issue);
        });

        setMyAreaReports(my);
        setOtherReports(other);

        const map = {};
        issues.forEach((issue) => {
          const id = issue._id || issue.id;
          map[id] = issue.comments || [];
        });
        setCommentsLocal(map);
      }
    } catch (err) {
      console.error("Error loading complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const sortAndFilterReports = (reports) => {
    let filtered = [...reports];
    const priorityOrder = { high: 1, medium: 2, low: 3, undefined: 4 };

    const statusOrder = {
      Reported: 1,
      "In Progress": 2,
      Resolved: 3,
      Closed: 4,
      undefined: 5,
    };

    // 1. Filter
    if (filter !== "all") {
      filtered = filtered.filter((r) => r.priority === filter);
    }

    // 2. Sort
    if (sortBy === "priority") {
      filtered.sort(
        (a, b) =>
          priorityOrder[a.priority] - priorityOrder[b.priority] ||
          new Date(b.createdAt) - new Date(a.createdAt)
      );
    } else if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "comments") {
      filtered.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
    } else if (sortBy === "status") {
      const normalizeStatus = (status) =>
        (status || "").toString().toLowerCase().replace(/_/g, " ").trim();

      const statusOrder = {
        reported: 1,
        "in progress": 2,
        resolved: 3,
        closed: 4,
      };

      filtered.sort((a, b) => {
        const statusA = normalizeStatus(a.status);
        const statusB = normalizeStatus(b.status);
        return (statusOrder[statusA] || 5) - (statusOrder[statusB] || 5);
      });
    }

    return filtered;
  };

  const renderComplaintCard = (complaint) => {
    const id = complaint._id || complaint.id;
    const upvotes = Array.isArray(complaint.upvotes)
      ? complaint.upvotes.length
      : complaint.upvotes || 0;
    const downvotes = Array.isArray(complaint.downvotes)
      ? complaint.downvotes.length
      : complaint.downvotes || 0;
    const priorityColor =
      {
        high: "#e63946",
        medium: "#ffb703",
        low: "#2a9d8f",
      }[complaint.priority] || "#6c757d";
    // console.log("Complaint status:", complaint.status);
    const rawStatus = (complaint.status || "Reported")
      .toLowerCase()
      .replace(/_/g, " ");
    const statusColorMap = {
      reported: "#ff075eff",
      "in progress": "#1410e2ff",
      resolved: "#2a703aff",
      closed: "#6c757d",
    };
    const statusColor = statusColorMap[rawStatus] || "#999999";
    const displayStatus = rawStatus.replace(/\b\w/g, (c) => c.toUpperCase());

    const hasUpvoted = (complaint.upvotes || [])
      .map(String)
      .includes(String(userId));
    const hasDownvoted = (complaint.downvotes || [])
      .map(String)
      .includes(String(userId));

    return (
      <article
        key={id}
        className="complaint-card"
        aria-labelledby={`title-${id}`}
      >
        {/* Top info row */}
        <div className="complaint-top-row">
          <div className="badge-group">
            <span
              className="priority-badge"
              style={{ background: priorityColor }}
            >
              {complaint.priority?.toUpperCase() || "N/A"}
            </span>
            <span className="status-badge" style={{ color: statusColor }}>
              {displayStatus}
            </span>
          </div>
          <span className="report-time">
            {formatDistanceToNow(new Date(complaint.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        {/* Image */}
        <img
          src={
            (complaint.imageUrls && complaint.imageUrls[0]) ||
            "/placeholder.jpg"
          }
          alt={complaint.title}
          className="complaint-image"
          onClick={() => openDetails(complaint)}
          style={{ cursor: "pointer" }}
        />

        {/* Content */}
        <div className="complaint-content">
          <p id={`title-${id}`} className="complaint-title">
            {complaint.title}
          </p>
          <p className="complaint-description">
            {complaint.description || "No description available."}
          </p>
        </div>

        {/* Actions */}
        <div className="complaint-actions">
          <div className="votes-buttons">
            <button
              className="votes-btn"
              title="Upvote"
              onClick={() => handleVote(id, "up")}
              style={
                hasUpvoted
                  ? { background: "linear-gradient(90deg,#1f7a66,#16594f)" }
                  : {}
              }
            >
              <i className="bi bi-hand-thumbs-up" /> {upvotes}
            </button>
            <button
              className="votes-btn"
              title="Downvote"
              onClick={() => handleVote(id, "down")}
              style={hasDownvoted ? { background: "#d94f4f" } : {}}
            >
              <i className="bi bi-hand-thumbs-down" /> {downvotes}
            </button>
          </div>

          <button
            className="comment-btn"
            onClick={() => openComments(complaint)}
          >
            <i className="bi bi-chat-left-text" /> Comments (
            {complaint.commentsCount || 0})
          </button>

          <button
            className="view-btn"
            onClick={() => openDetails(complaint)}
            title="viewDetails"
          >
            <i className="bi bi-eye"></i>
          </button>
        </div>
      </article>
    );
  };

  const handleVote = async (issueId, type) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BACKEND}/api/issues/${issueId}/vote/${type}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success && res.data.issue) {
        updateIssueInState(res.data.issue);
        return;
      }

      const applyOptimistic = (list) =>
        list.map((c) => {
          if ((c._id || c.id) !== issueId) return c;
          const isUp = type === "up";
          const userIdStr = String(userId);
          const up = new Set((c.upvotes || []).map(String));
          const down = new Set((c.downvotes || []).map(String));

          if (isUp) {
            if (up.has(userIdStr)) up.delete(userIdStr);
            else {
              up.add(userIdStr);
              down.delete(userIdStr);
            }
          } else {
            // Downvote
            if (down.has(userIdStr)) down.delete(userIdStr);
            else {
              down.add(userIdStr);
              up.delete(userIdStr);
            }
          }
          return { ...c, upvotes: Array.from(up), downvotes: Array.from(down) };
        });

      setMyAreaReports((prev) => applyOptimistic(prev));
      setOtherReports((prev) => applyOptimistic(prev));

      if (
        selectedComplaint &&
        (selectedComplaint._id || selectedComplaint.id) === issueId
      ) {
        setSelectedComplaint((prev) => applyOptimistic([prev])[0] || prev);
      }
      if (
        selectedComplaintForComments &&
        (selectedComplaintForComments._id ||
          selectedComplaintForComments.id) === issueId
      ) {
        setSelectedComplaintForComments(
          (prev) => applyOptimistic([prev])[0] || prev
        );
      }
    } catch (err) {
      console.error("Vote error:", err);
      alert("Failed to submit vote. Make sure you're logged in and try again.");
    }
  };

  const handleAddComment = async (issueId) => {
    const text = (newComment || "").trim();
    if (!text || !issueId) {
      if (!text) alert("Please enter a comment.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BACKEND}/api/issues/${issueId}/comments`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        if (res.data.comment) {
          setComments((prev) => [res.data.comment, ...(prev || [])]);
        }

        setCommentsLocal((prev) => ({
          ...(prev || {}),
          [issueId]: [res.data.comment, ...(prev?.[issueId] || [])],
        }));

        if (res.data.issue) {
          updateIssueInState(res.data.issue);
        } else {
          setMyAreaReports((prev) =>
            prev.map((i) =>
              (i._id || i.id) === issueId
                ? { ...i, commentsCount: (i.commentsCount || 0) + 1 }
                : i
            )
          );
          setOtherReports((prev) =>
            prev.map((i) =>
              (i._id || i.id) === issueId
                ? { ...i, commentsCount: (i.commentsCount || 0) + 1 }
                : i
            )
          );
        }

        setNewComment("");
      } else {
        console.warn("Unexpected add-comment response:", res.data);
        alert("Comment posted but server response unexpected.");
      }
    } catch (err) {
      console.error("Error posting comment:", err, err.response?.data);
      const serverMessage = err.response?.data?.message || err.message;
      alert("Failed to post comment: " + serverMessage);
    }
  };
  const handleDeleteComment = async (issueId, commentId) => {
    const confirmResult = await Swal.fire({
      title: "Are you sure?",
      text: "This comment will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      background: "linear-gradient(to bottom, #D3F1DE, #81B79D)",
      color: "#1B1B1B",
      confirmButtonColor: "#005347",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      className: "swalalerts",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(
        `${BACKEND}/api/issues/${issueId}/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));

        setCommentsLocal((prev) => ({
          ...prev,
          [issueId]: (prev[issueId] || []).filter((c) => c._id !== commentId),
        }));

        setMyAreaReports((prev) =>
          prev.map((i) =>
            (i._id || i.id) === issueId
              ? { ...i, commentsCount: Math.max((i.commentsCount || 1) - 1, 0) }
              : i
          )
        );

        setOtherReports((prev) =>
          prev.map((i) =>
            (i._id || i.id) === issueId
              ? { ...i, commentsCount: Math.max((i.commentsCount || 1) - 1, 0) }
              : i
          )
        );

        Swal.fire({
          title: "Deleted!",
          text: "Your comment has been deleted successfully.",
          icon: "success",
          background: "linear-gradient(to bottom, #D3F1DE, #81B79D)",
          color: "#1B1B1B",
          confirmButtonColor: "#005347",
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
        Swal.fire({
          title: "Error",
          text: res.data?.message || "Failed to delete comment.",
          icon: "error",
          confirmButtonColor: "#007a60",
        });
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      Swal.fire({
        title: "Error!",
        text:
          err.response?.data?.message ||
          "Something went wrong. Please try again.",
        icon: "error",
        cbackground: "linear-gradient(to bottom, #D3F1DE, #81B79D)",
        color: "#1B1B1B",
        confirmButtonColor: "#005347",
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  const openDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setModalImageIndex(0);
    document.body.classList.add("modal-open");
  };

  const closeDetailsModal = () => {
    setSelectedComplaint(null);
    setModalImageIndex(0);
    document.body.classList.remove("modal-open");
  };

  const openComments = (complaint) => {
    setSelectedComplaintForComments(complaint);
    fetchComments(complaint._id || complaint.id, 1);
    setPage(1);
    document.body.classList.add("modal-open");
  };
  const closeCommentsModal = () => {
    setSelectedComplaintForComments(null);
    setNewComment("");
    setComments([]);
    setPage(1);
    setTotalPages(1);
    document.body.classList.remove("modal-open");
  };

  const prevImage = () => {
    if (!selectedComplaint?.imageUrls?.length) return;
    setModalImageIndex(
      (i) =>
        (i - 1 + selectedComplaint.imageUrls.length) %
        selectedComplaint.imageUrls.length
    );
  };
  const nextImage = () => {
    if (!selectedComplaint?.imageUrls?.length) return;
    setModalImageIndex((i) => (i + 1) % selectedComplaint.imageUrls.length);
  };

  const openLocationInMaps = (complaint) => {
    const lat = complaint.latitude || complaint.lat;
    const lon = complaint.longitude || complaint.lon;
    let url = "";
    if (lat && lon)
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    else {
      const q =
        complaint.address ||
        complaint.location ||
        complaint.landmark ||
        complaint.title ||
        "";
      if (!q) return;
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        q
      )}`;
    }
    window.open(url, "_blank");
  };

  return (
    <div className="view-complaints-page">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="complaints-header">
          <h1>Community Reports</h1>
          <p>
            See what issues your community is reporting and show your support
          </p>
        </div>

        <div
          style={{ textAlign: "end", display: "flex", alignItems: "center" }}
        >
          <label>Filter by Priority: </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <label style={{ marginLeft: 16 }}>Sort by: </label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="priority">Priority</option>
            <option value="newest">Newest</option>
            <option value="comments">Most Comments</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {loading && <p style={{ textAlign: "center" }}>Loading reports…</p>}

      {/* User area reports */}
      <section aria-label="Your area reports">
        <h2
          style={{
            color: "var(--g-pale)",
            display: "flex",
            justifyContent: "center",
            textTransform: "capitalize",
          }}
        >
          Reports in your area
        </h2>

        {sortAndFilterReports(myAreaReports).length === 0 ? (
          <p style={{ color: "var(--g-accent)", marginLeft: "1.5rem" }}>
            No reports found in your postal code matching current filters.
          </p>
        ) : (
          <div className="complaints-grid" style={{ marginTop: 8 }}>
            {sortAndFilterReports(myAreaReports).map(renderComplaintCard)}
          </div>
        )}
      </section>

      <hr className="section-divider" style={{ margin: "28px 1.5rem" }} />

      {/* Other reports */}
      <section aria-label="Other reports">
        <h2
          style={{
            color: "var(--g-pale)",
            display: "flex",
            justifyContent: "center",
            textTransform: "capitalize",
          }}
        >
          Other reports
        </h2>
        <div className="complaints-grid" style={{ marginTop: 8 }}>
          {sortAndFilterReports(otherReports).length === 0 ? (
            <p style={{ color: "var(--g-accent)", marginLeft: "1.5rem" }}>
              No other reports found matching current filters.
            </p>
          ) : (
            <div className="complaints-grid" style={{ marginTop: 8 }}>
              {sortAndFilterReports(otherReports).map(renderComplaintCard)}
            </div>
          )}
        </div>
      </section>

      {/* Details modal */}
      {selectedComplaint && (
        <div
          className="modal-overlay"
          onClick={closeDetailsModal}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>
              <i className="bi bi-arrow-bar-right"></i>
              {selectedComplaint.title}
            </h2>

            <p className="modal-description">{selectedComplaint.description}</p>

            <div style={{ position: "relative", marginBottom: 12 }}>
              {selectedComplaint.imageUrls &&
              selectedComplaint.imageUrls.length > 0 ? (
                <>
                  <img
                    src={selectedComplaint.imageUrls[modalImageIndex]}
                    alt={`Image ${modalImageIndex + 1}`}
                    className="modal-image"
                    onClick={() =>
                      window.open(
                        selectedComplaint.imageUrls[modalImageIndex],
                        "_blank"
                      )
                    }
                  />
                  {selectedComplaint.imageUrls.length > 1 && (
                    <>
                      <button
                        aria-label="Previous image"
                        onClick={prevImage}
                        className="gallery-arrow left"
                      >
                        <i className="bi bi-chevron-left" />
                      </button>
                      <button
                        aria-label="Next image"
                        onClick={nextImage}
                        className="gallery-arrow right"
                      >
                        <i className="bi bi-chevron-right" />
                      </button>
                    </>
                  )}
                  {selectedComplaint.imageUrls.length > 1 && (
                    <div className="imagecount">
                      <i className="bi bi-images"></i> {modalImageIndex + 1} /{" "}
                      {selectedComplaint.imageUrls.length}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="no-image"
                  style={{ height: 240, borderRadius: 8 }}
                >
                  <span>No images available</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <p
                className="modal-location"
                onClick={() => openLocationInMaps(selectedComplaint)}
              >
                <i className="bi bi-geo-alt-fill" />{" "}
                {selectedComplaint.address ||
                  selectedComplaint.location ||
                  "Location not set"}
              </p>
              {selectedComplaint.landmark && (
                <p className="modal-landmark">
                  <i className="bi bi-signpost-2" style={{ marginRight: 8 }} />
                  {selectedComplaint.landmark}
                </p>
              )}
            </div>

            <div
              className="comment-actions"
              style={{
                justifyContent: "space-between",
                gap: "1rem",
                marginTop: "1.5rem",
              }}
            >
              <p className="reported-by">
                <i class="bi bi-person">
                   
                  {selectedComplaint.reportedBy?.name
                    ? selectedComplaint.reportedBy.name
                    : "Unknown User"}
                </i>
              </p>
              <div
                style={{
                  justifyContent: "space-between",
                  display: "flex",
                  gap: "1rem",
                  // marginTop: "1.5rem",
                }}
              >
                <button
                  className="view-btn"
                  onClick={() => {
                    closeDetailsModal();
                    openComments(selectedComplaint);
                  }}
                  style={{ background: "#007a60" }}
                >
                  <i className="bi bi-chat-left-text" /> View/Add Comments
                </button>
                <button className="close-btn" onClick={closeDetailsModal}>
                  ✖
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments modal */}
      {selectedComplaintForComments && (
        <div
          className="modal-overlay"
          onClick={closeCommentsModal}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>
              Comments for: {selectedComplaintForComments.title}
            </h2>

            <div className="comments-section" style={{ background: "#dff2e9" }}>
              <h3>Add Comment</h3>
              <textarea
                className="comment-input"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="comment-actions">
                <button
                  className="post-btn"
                  onClick={() =>
                    handleAddComment(
                      selectedComplaintForComments._id ||
                        selectedComplaintForComments.id
                    )
                  }
                >
                  <i className="bi bi-send" /> Post Comment
                </button>
                <button className="close-btn" onClick={closeCommentsModal}>
                  Close
                </button>
              </div>

              <h3
                style={{
                  marginTop: "1.5rem",
                  borderTop: "1px solid #cbe7dc",
                  paddingTop: "1rem",
                }}
              >
                All Comments
              </h3>
              <div className="comments-list" style={{ maxHeight: "300px" }}>
                {comments.length > 0 ? (
                  comments.map((c, idx) => {
                    const username =
                      (c.userId &&
                        typeof c.userId === "object" &&
                        (c.userId.name || c.userId.username)) ||
                      "User";

                    const isAuthor =
                      c.userId &&
                      (typeof c.userId === "object"
                        ? c.userId._id
                        : c.userId.toString()) === (user?._id || user?.id);

                    return (
                      <div key={idx} className="comment-bubble">
                        <div className="comment-header">
                          <strong style={{ color: "#004c3f" }}>
                            {username}
                          </strong>
                          {c.createdAt && (
                            <span className="comment-time">
                              • {formatDistanceToNow(new Date(c.createdAt))}
                            </span>
                          )}

                          {isAuthor && (
                            <button
                              onClick={() =>
                                handleDeleteComment(
                                  selectedComplaintForComments._id ||
                                    selectedComplaintForComments.id,
                                  c._id
                                )
                              }
                              style={{
                                marginLeft: "auto",
                                background: "transparent",
                                border: "none",
                                color: "#b22222",
                                cursor: "pointer",
                              }}
                              title="Delete comment"
                            >
                              <i className="bi bi-trash" />
                            </button>
                          )}
                        </div>
                        <p className="comment-text">{c.text}</p>
                      </div>
                    );
                  })
                ) : loading ? (
                  <p>Loading comments...</p>
                ) : (
                  <p>No comments yet. Be the first to start a discussion!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewComplaints;
