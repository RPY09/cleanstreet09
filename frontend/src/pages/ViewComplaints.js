import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./ViewComplaints.css";

const BACKEND = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ViewComplaints = () => {
  const { user } = useAuth();
  const [myAreaReports, setMyAreaReports] = useState([]);
  const [otherReports, setOtherReports] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedComplaintForComments, setSelectedComplaintForComments] =
    useState(null);
  const [commentsLocal, setCommentsLocal] = useState({});
  const [newComment, setNewComment] = useState("");
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const userId = user?._id || user?.id;

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

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BACKEND}/api/issues`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        const myArea = res.data.myAreaReports || [];
        const others = res.data.otherReports || [];

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
          const ip = (issue.postalCode || issue.reportedBy?.postalCode || "")
            .toString()
            .trim();
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

  const handleVote = async (issueId, type) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BACKEND}/api/issues/${issueId}/${type}`,
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
          const up = new Set((c.upvotes || []).map(String));
          const down = new Set((c.downvotes || []).map(String));
          if (isUp) {
            if (up.has(String(userId))) up.delete(String(userId));
            else {
              up.add(String(userId));
              down.delete(String(userId));
            }
          } else {
            if (down.has(String(userId))) down.delete(String(userId));
            else {
              down.add(String(userId));
              up.delete(String(userId));
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
        setSelectedComplaint((prev) => {
          const updated = applyOptimistic([prev])[0];
          return updated || prev;
        });
      }
      if (
        selectedComplaintForComments &&
        (selectedComplaintForComments._id ||
          selectedComplaintForComments.id) === issueId
      ) {
        setSelectedComplaintForComments((prev) => {
          const updated = applyOptimistic([prev])[0];
          return updated || prev;
        });
      }
    } catch (err) {
      console.error("Vote error:", err);

      alert("Failed to submit vote. Make sure you're logged in and try again.");
    }
  };

  // Comment handler: post comment, update lists/modals/comments cache
  const handleAddComment = async (issueId) => {
    const text = newComment?.trim();
    if (!text) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BACKEND}/api/issues/${issueId}/comment`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success && res.data.issue) {
        const updated = res.data.issue;
        updateIssueInState(updated);
      } else {
        // fallback local add
        setCommentsLocal((prev) => ({
          ...prev,
          [issueId]: [
            ...(prev[issueId] || []),
            { text, user: user?.name || "You", createdAt: new Date() },
          ],
        }));
      }
      setNewComment("");
      // if comments modal open for this issue, refresh it to show updated comments
      if (
        selectedComplaintForComments &&
        (selectedComplaintForComments._id ||
          selectedComplaintForComments.id) === issueId
      ) {
        // update selectedComplaintForComments comments from cache
        setSelectedComplaintForComments((prev) => {
          const updated = {
            ...(prev || {}),
            comments: commentsLocal[issueId] || [],
          };
          return updated;
        });
      }
    } catch (err) {
      console.error("Add comment error:", err);
      alert("Failed to post comment. Please try again.");
    }
  };

  // --- Modal and image navigation helpers ---
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
    document.body.classList.add("modal-open");
    const id = complaint._id || complaint.id;
    setCommentsLocal((prev) => ({
      ...prev,
      [id]: prev[id] || complaint.comments || [],
    }));
  };

  const closeCommentsModal = () => {
    setSelectedComplaintForComments(null);
    setNewComment("");
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

  // Map link helper
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
      <div className="complaints-header">
        <h1>Community Reports</h1>
        <p>See what issues your community is reporting and show your support</p>
      </div>

      {loading && <p style={{ textAlign: "center" }}>Loading reports…</p>}

      {/* User area reports */}
      <section aria-label="Your area reports">
        <h2 style={{ color: "var(--g-pale)", marginLeft: "1.5rem" }}>
          Reports in your area
        </h2>
        {myAreaReports.length === 0 ? (
          <p style={{ color: "var(--g-accent)", marginLeft: "1.5rem" }}>
            No reports found in your postal code.
          </p>
        ) : (
          <div className="complaints-grid" style={{ marginTop: 8 }}>
            {myAreaReports.map((complaint) => {
              const id = complaint._id || complaint.id;
              const upvotes = Array.isArray(complaint.upvotes)
                ? complaint.upvotes.length
                : complaint.upvotes || 0;
              const downvotes = Array.isArray(complaint.downvotes)
                ? complaint.downvotes.length
                : complaint.downvotes || 0;
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
                  <div className="complaint-content">
                    <p id={`title-${id}`} className="complaint-title">
                      {complaint.title}
                    </p>
                    <p style={{ marginTop: 6, color: "#194b3f", fontSize: 14 }}>
                      {complaint.description?.slice(0, 120)}
                      {complaint.description &&
                      complaint.description.length > 120
                        ? "…"
                        : ""}
                    </p>
                  </div>
                  <div className="complaint-actions">
                    <div className="vote-buttons">
                      <button
                        className="vote-btn"
                        title="Upvote"
                        onClick={() => handleVote(id, "up")}
                        style={
                          hasUpvoted
                            ? {
                                background:
                                  "linear-gradient(90deg,#1f7a66,#16594f)",
                              }
                            : {}
                        }
                      >
                        <i className="bi bi-hand-thumbs-up" /> {upvotes}
                      </button>
                      <button
                        className="vote-btn"
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
                      {(commentsLocal[id] || []).length})
                    </button>
                    <button
                      className="view-btn"
                      onClick={() => openDetails(complaint)}
                      title="viewDetails"
                    >
                      <i class="bi bi-eye"></i>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <hr className="section-divider" style={{ margin: "28px 1.5rem" }} />

      {/* Other reports */}
      <section aria-label="Other reports">
        <h2 style={{ color: "var(--g-pale)", marginLeft: "1.5rem" }}>
          Other reports
        </h2>
        <div className="complaints-grid" style={{ marginTop: 8 }}>
          {otherReports.length === 0 ? (
            <p style={{ color: "var(--g-accent)", marginLeft: "1.5rem" }}>
              No other reports found.
            </p>
          ) : (
            otherReports.map((complaint) => {
              const id = complaint._id || complaint.id;
              const upvotes = Array.isArray(complaint.upvotes)
                ? complaint.upvotes.length
                : complaint.upvotes || 0;
              const downvotes = Array.isArray(complaint.downvotes)
                ? complaint.downvotes.length
                : complaint.downvotes || 0;
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
                  <div className="complaint-content">
                    <p id={`title-${id}`} className="complaint-title">
                      {complaint.title}
                    </p>
                    <p style={{ marginTop: 6, color: "#194b3f", fontSize: 14 }}>
                      {complaint.description?.slice(0, 120)}
                      {complaint.description &&
                      complaint.description.length > 120
                        ? "…"
                        : ""}
                    </p>
                  </div>
                  <div className="complaint-actions">
                    <div className="vote-buttons">
                      <button
                        className="vote-btn"
                        title="Upvote"
                        onClick={() => handleVote(id, "up")}
                        style={
                          hasUpvoted
                            ? {
                                background:
                                  "linear-gradient(90deg,#1f7a66,#16594f)",
                              }
                            : {}
                        }
                      >
                        <i className="bi bi-hand-thumbs-up" /> {upvotes}
                      </button>
                      <button
                        className="vote-btn"
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
                      {(commentsLocal[id] || []).length})
                    </button>
                    <button
                      className="view-btn"
                      onClick={() => openDetails(complaint)}
                      title="viewDetails"
                    >
                      <i class="bi bi-eye"></i>
                    </button>
                  </div>
                </article>
              );
            })
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
              <i class="bi bi-arrow-bar-right"></i>
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
                    <div
                      style={{
                        marginTop: 8,
                        color: "#0b2b26",
                        fontWeight: 600,
                      }}
                    >
                      <i class="bi bi-images"></i> {modalImageIndex + 1} /{" "}
                      {selectedComplaint.imageUrls.length}
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    height: 240,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f0f6f0",
                    borderRadius: 8,
                  }}
                >
                  <span style={{ color: "#2c3a34" }}>No images available</span>
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
                justifyContent: "flex-end",
                gap: "1rem",
                marginTop: "1.5rem",
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
                {commentsLocal[
                  selectedComplaintForComments._id ||
                    selectedComplaintForComments.id
                ] &&
                commentsLocal[
                  selectedComplaintForComments._id ||
                    selectedComplaintForComments.id
                ].length > 0 ? (
                  commentsLocal[
                    selectedComplaintForComments._id ||
                      selectedComplaintForComments.id
                  ].map((c, idx) => {
                    const username =
                      (c.user &&
                        typeof c.user === "object" &&
                        (c.user.name || c.user.username)) ||
                      (typeof c.user === "string" && c.user === String(userId)
                        ? user?.name
                        : c.user) ||
                      "User";
                    return (
                      <div key={idx} className="comment-bubble">
                        <strong style={{ marginRight: 8, color: "#004c3f" }}>
                          {username}:
                        </strong>{" "}
                        {c.text}
                      </div>
                    );
                  })
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
