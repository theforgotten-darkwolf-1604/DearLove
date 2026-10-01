 import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

// =======================================================
// APP
// =======================================================

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("dearlove_token")
  );

  const [page, setPage] = useState("home");
  const [users, setUsers] = useState([]);
const [receivedConnections, setReceivedConnections] = useState([]);
const [connectionLoading, setConnectionLoading] = useState(false);
const [sentConnections, setSentConnections] = useState([]);
const [sentConnectionLoading, setSentConnectionLoading] = useState(false);
  const [location, setLocation] = useState(null);
const [sharedLocations, setSharedLocations] = useState([]);
  const [matches, setMatches] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);

  // =====================================================
  // LOGOUT
  // =====================================================

  function logout() {
    localStorage.removeItem("dearlove_token");
    setToken(null);
    setMe(null);
    setLocation(null);
    setPage("home");
  }

  // =====================================================
  // LOAD CURRENT USER
  // =====================================================

  async function loadMe() {
    if (!token) return;

    try {
      const response = await fetch(`${API}/me`, {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load account");
      }

      const data = await response.json();
      setMe(data);
    } catch (err) {
      console.error("Load account error:", err);
    }
  }

  // =====================================================
  // LOAD SHARED LOCATIONS
  // =====================================================

  async function loadSharedLocations() {
    if (!token) return;

    try {
      const response = await fetch(
        `${API}/location/shared-with-me`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) {
        setSharedLocations([]);
        return;
      }

      const data = await response.json();

      setSharedLocations(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Shared locations error:",
        error
      );

      setSharedLocations([]);
    }
  }

  // =====================================================
  // LOAD LOCATION
  // =====================================================

   async function loadLocation() {
  const savedToken =
    localStorage.getItem("dearlove_token");

  if (!savedToken) {
    setLocation(null);
    return;
  }

  try {
    const response = await fetch(
      `${API}/location`,
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${savedToken}`,
        },
      }
    );

    if (response.status === 401) {
      logout();
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Location loading error:",
        data
      );
      setLocation(null);
      return;
    }

    if (
      data &&
      data.location_id &&
      data.latitude !== undefined &&
      data.longitude !== undefined
    ) {
      setLocation({
        location_id: data.location_id,
        user_id: data.user_id,
        latitude: data.latitude,
        longitude: data.longitude,
        created_at: data.created_at,
      });
    } else {
      setLocation(null);
    }

  } catch (error) {
    console.error(
      "Location loading failed:",
      error
    );

    setLocation(null);
  }
}

  // =====================================================
  // SAVE CURRENT LOCATION
  // =====================================================

  function saveLocation() {
    if (!token) {
      alert("Please login first.");
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(`${API}/location`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            alert(
              data.detail ||
                "Unable to save location."
            );
            return;
          }
setLocation({
  location_id: data.location_id,
  user_id: data.user_id,
  latitude: data.latitude,
  longitude: data.longitude,
  created_at: data.created_at,
});
                   alert("Location saved successfully! 📍");
        } catch (err) {
          console.error("Save location error:", err);
          alert("Unable to connect to DearLove server.");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Please allow location access.");
      }
    );
  }

  // =====================================================
  // CONNECTION REQUEST
  // =====================================================

  async function sendConnectionRequest(receiverId) {
    if (!token) {
      alert("No login token found.");
      return;
    }

    try {
      const response = await fetch(
        `${API}/connections/request?receiver_id=${receiverId}`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
            "Unable to send connection request."
        );
        return;
      }

      alert(
        data.message ||
          "Connection request sent successfully."
      );
    } catch (err) {
      console.error("Connection request error:", err);
      alert("Unable to connect to DearLove server.");
    }
  }

  // =====================================================
  // USERS
  // =====================================================

     async function loadUsers() {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/users/profiles`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load users");
      }

      const data = await response.json();

      setUsers(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error("Load users error:", err);

      setError(
        "Unable to load users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }
  async function loadReceivedConnections() {
    if (!token) return;

    setConnectionLoading(true);

    try {
      const response = await fetch(
        `${API}/connections/received`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load connection requests");
      }

      const data = await response.json();

      setReceivedConnections(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Load connection requests error:",
        err
      );
    } finally {
      setConnectionLoading(false);
    }
  }

  async function loadSentConnections() {
    if (!token) return;

    setSentConnectionLoading(true);

    try {
      const response = await fetch(
        `${API}/connections/sent`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Unable to load sent connection requests"
        );
      }

      const data = await response.json();

      setSentConnections(
        Array.isArray(data) ? data : []
      );

    } catch (err) {
      console.error(
        "Load sent connection requests error:",
        err
      );
    } finally {
      setSentConnectionLoading(false);
    }
  }

  // =====================================================
  // CONNECTION REQUESTS
  // =====================================================

  async function handleConnectionAction(connectionId, action) {
    if (!token) {
      alert("No login token found.");
      return;
    }

    try {
      const response = await fetch(
        `${API}/connections/${connectionId}/${action}`,
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
            `Unable to ${action} connection request.`
        );
        return;
      }

      alert(
        data.message ||
          `Connection request ${action}ed successfully.`
      );

      await loadReceivedConnections();
      await loadMatches();

    } catch (err) {
      console.error(
        `Connection ${action} error:`,
        err
      );

      alert(
        "Unable to connect to DearLove server."
      );
    }
  }

  async function acceptConnection(connectionId) {
    await handleConnectionAction(
      connectionId,
      "accept"
    );
  }

  async function rejectConnection(connectionId) {
    await handleConnectionAction(
      connectionId,
      "reject"
    );
  }

  // =====================================================
  // MATCHES
  // =====================================================

  async function loadMatches() {
    if (!token) return;

    try {
      const response = await fetch(
        `${API}/matches`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setMatches(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error("Load matches error:", err);
    }
  }

  // =====================================================
  // CONVERSATIONS
  // =====================================================

  async function loadConversations() {
    if (!token) return;

    try {
      const response = await fetch(
        `${API}/conversations`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setConversations(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Load conversations error:",
        err
      );
    }
  }

  // =====================================================
  // LIKE
  // =====================================================

  async function likeUser(userId) {
    if (!token) return;

    try {
      const response = await fetch(
        `${API}/likes?liked_user_id=${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
            "Unable to like this user."
        );
        return;
      }

      alert(
        data.message ||
          "User liked successfully ❤️"
      );

      await loadMatches();
    } catch (err) {
      console.error("Like error:", err);

      alert(
        "Unable to connect to DearLove server."
      );
    }
  }

  // =====================================================
  // OPEN USER PROFILE
  // =====================================================

  function openUser(user) {
    setSelectedUser(user);
    setPage("user-profile");
  }

  // =====================================================
  // OPEN CONVERSATION
  // =====================================================

  async function openConversation(user) {
    setSelectedUser(user);
    setPage("conversation");

    try {
      const response = await fetch(
        `${API}/messages/conversation/${user.user_id}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) {
        setMessages([]);
        return;
      }

      const data = await response.json();

      setMessages(
        Array.isArray(data) ? data : []
      );

      await fetch(
        `${API}/messages/conversation/${user.user_id}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      await loadConversations();
    } catch (err) {
      console.error(
        "Open conversation error:",
        err
      );

      setMessages([]);
    }
  }

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  async function sendMessage() {
    if (!selectedUser || !messageText.trim()) {
      return;
    }

    try {
      const params = new URLSearchParams();

      params.append(
        "receiver_id",
        selectedUser.user_id
      );

      params.append(
        "content",
        messageText.trim()
      );

      const response = await fetch(
        `${API}/messages?${params.toString()}`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
            "Unable to send message."
        );
        return;
      }

      setMessageText("");

      await openConversation(selectedUser);
      await loadConversations();
    } catch (err) {
      console.error("Send message error:", err);
      alert("Unable to send message.");
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!token) return;

    loadMe();
    loadLocation();
    loadMatches();
    loadConversations();
  loadSharedLocations();
  }, [token]);

  // =====================================================
  // MESSAGE AUTO REFRESH
  // =====================================================

  useEffect(() => {
    if (
      !token ||
      page !== "conversation" ||
      !selectedUser
    ) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `${API}/messages/conversation/${selectedUser.user_id}`,
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        setMessages(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        console.error(
          "Message refresh error:",
          err
        );
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [token, page, selectedUser]);

  // =====================================================
  // FILTER USERS
  // =====================================================

  const filteredUsers = users.filter((user) => {
    const username = user.username || "";

    const fullName =
      user.profile?.full_name || "";

    const text =
      `${username} ${fullName}`.toLowerCase();

    return text.includes(
      search.toLowerCase()
    );
  });

  // =====================================================
  // LOGIN SCREEN
  // =====================================================

  if (!token) {
    return (
      <LoginScreen
        setToken={setToken}
      />
    );
  }

  // =====================================================
  // APP
  // =====================================================

  return (
    <div
      style={styles.app}
      className="dearlove-app"
    >
      <aside style={styles.sidebar}>

        <div style={styles.logo}>
          ❤️ DearLove
        </div>

        <div style={styles.tagline}>
          Connect. Care. Love.
        </div>

        <button
          type="button"
          style={styles.navButton}
          onClick={() =>
            setPage("home")
          }
        >
          🏠 Home
        </button>

        <button
          type="button"
          style={styles.navButton}
          onClick={() =>
            setPage("notifications")
          }
        >
          🔔 Notifications
        </button>

        <button
          type="button"
          style={styles.navButton}
          onClick={() => {
            setPage("messages");
            loadConversations();
          }}
        >
          💬 Messages
        </button>

        <button
          type="button"
          style={styles.navButton}
          onClick={() => {
            setPage("people");
            loadUsers();
          }}
        >
          👥 People
        </button>

        <button
          type="button"
          style={styles.navButton}
          onClick={() => {
            setPage("matches");
            loadMatches();
          }}
        >
          ❤️ Matches
        </button>
<button
  type="button"
  style={styles.navButton}
 
onClick={() => {
  setPage("connections");
  loadReceivedConnections();
  loadSentConnections();
}}
>
  👥 Connections
</button>

        <button
          type="button"
          style={styles.navButton}
          onClick={() =>
            setPage("profile")
          }
        >
          👤 Profile
        </button>

        <button
          type="button"
          style={styles.navButton}
          onClick={() =>
            setPage("settings")
          }
        >
          ⚙️ Settings
        </button>
<button
  type="button"
  style={styles.navButton}
  onClick={() =>
    setPage("emergency-contacts")
  }
>
  🚨 Emergency Contacts
</button>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          style={styles.logoutButton}
          onClick={logout}
        >
          🚪 Logout
        </button>

      </aside>

      <main style={styles.main}>

        {page === "home" && (
          <Home
            me={me}
            users={users}
            matches={matches}
            conversations={conversations}
            location={location}
  sharedLocations={sharedLocations}
            saveLocation={saveLocation}
            goPeople={() => {
              setPage("people");
              loadUsers();
            }}
token={token}
          />
        )}

        {page === "people" && (
          <People
            users={filteredUsers}
            search={search}
            setSearch={setSearch}
            loading={loading}
            error={error}
            onView={openUser}
            onConnect={sendConnectionRequest}
          />
        )}

        {page === "user-profile" &&
          selectedUser && (
            <UserProfile
              user={selectedUser}
              onBack={() =>
                setPage("people")
              }
              onLike={likeUser}
              onMessage={openConversation}
              onConnect={
                sendConnectionRequest
              }
            />
          )}

        {page === "messages" && (
          <Messages
            conversations={conversations}
            onOpen={openConversation}
          />
        )}

        {page === "conversation" &&
          selectedUser && (
            <Conversation
              user={selectedUser}
              messages={messages}
              messageText={messageText}
              setMessageText={setMessageText}
              onSend={sendMessage}
              onBack={() =>
                setPage("messages")
              }
              currentUserId={me?.user_id}
            />
          )}

        {page === "matches" && (
          <Matches
            matches={matches}
            onMessage={openConversation}
          />
        )}
{page === "connections" && (
  <Connections
    requests={receivedConnections}
    loading={connectionLoading}
    sentRequests={sentConnections}
    sentLoading={sentConnectionLoading}
    onAccept={acceptConnection}
    onReject={rejectConnection}
  />
)}
        {page === "profile" && (
          <Profile me={me} />
        )}

        {page === "settings" && (
          <Settings logout={logout} />
        )}
{page === "emergency-contacts" && (
  <EmergencyContacts token={token} />
)}

        {page === "notifications" && (
          <Notifications token={token} />
        )}

      </main>
    </div>
  );
}

// =======================================================
// LOGIN
// =======================================================

function LoginScreen({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const body = new URLSearchParams();

      body.append("username", username);
      body.append("password", password);

      const response = await fetch(
        `${API}/token`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Login failed"
        );
      }

      localStorage.setItem(
        "dearlove_token",
        data.access_token
      );

      setToken(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.loginPage}>

      <div style={styles.loginCard}>

        <div style={styles.bigHeart}>
          ❤️
        </div>

        <h1>DearLove</h1>

        <p style={styles.subtitle}>
          Connect. Care. Love.
        </p>

        <form onSubmit={login}>

          <input
            style={styles.input}
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <button
            style={styles.primaryButton}
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

      </div>

    </div>
  );
}


// =======================================================
// HOME
// =======================================================

 function Home({
  me,
  users,
  matches,
  conversations,
  location,
sharedLocations,
  saveLocation,
  goPeople,
  token,
}) {
  return (
    <div>

      <h1>
        Welcome to DearLove ❤️
      </h1>

      <p style={styles.subtitle}>
        Hello, {me?.username || "User"}!
      </p>

      <div style={styles.cards}>

        <StatCard
          icon="💬"
          title="Messages"
          value={conversations.length}
        />

        <StatCard
          icon="❤️"
          title="Matches"
          value={matches.length}
        />

        <StatCard
          icon="👥"
          title="People"
          value={users.length}
        />

      </div>

      <div style={styles.heroCard}>

        <div style={styles.heroIcon}>
          ❤️
        </div>

        <h2>
          Find Your Dear People
        </h2>

        <p>
          Discover other DearLove users and
          connect with people who matter.
        </p>

        <button
          style={styles.primaryButton}
          onClick={goPeople}
        >
          Explore People
        </button>

      </div>

      <div style={styles.heroCard}>

        <div style={styles.heroIcon}>
          📍
        </div>

        <h2>
          My Location
        </h2>

        <p>
          Your location is securely saved
          to DearLove.
        </p>

        {location ? (
          <div style={styles.locationCard}>

            <p>
              📍{" "}
              <strong>
                Location Saved
              </strong>
            </p>

            <p>
              Latitude: {location.latitude}
            </p>

            <p>
              Longitude: {location.longitude}
            </p>

            {location.created_at && (
              <p>
                🕐 Saved:{" "}
                {new Date(
                  location.created_at
                ).toLocaleString()}
              </p>
            )}

          </div>
        ) : (
          <p>
            No location saved yet.
          </p>
        )}

        <button
          type="button"
          style={styles.primaryButton}
          onClick={saveLocation}
        >
          📍 Save My Location
        </button>
<button
  type="button"
  style={{
    ...styles.secondaryButton,
    marginTop: "12px",
  }}
  onClick={async () => {
    const viewerId = window.prompt(
      "Enter the DearLove User ID you want to share your location with:"
    );

    if (!viewerId) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/location/share?viewer_id=${viewerId}`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
            "Unable to share location."
        );
        return;
      }

      alert(
        data.message ||
          "Location sharing enabled successfully! 📍❤️"
      );
    } catch (error) {
      console.error(
        "Location sharing error:",
        error
      );

      alert(
        "Unable to connect to DearLove server."
      );
    }
  }}
>
  📍 Share My Location
</button>
      </div>

      <div style={styles.heroCard}>

        <div style={styles.heroIcon}>
          🚨
        </div>

        <h2>
          Emergency SOS
        </h2>

        <p>
          Need help? Activate an emergency SOS alert.
        </p>

        <button
          type="button"
         style={{
  ...styles.primaryButton,
  backgroundColor: "#d32f2f"
}}
 onClick={async () => {
            const confirmed = window.confirm(
              "Are you sure you want to activate SOS? 🚨"
            );

            if (!confirmed) {
              return;
            }

            try {
              const response = await fetch(
                `${API}/sos`,
                {
                  method: "POST",
                  headers: {
                    Authorization: "Bearer " + token,
                  },
                }
              );

              const data = await response.json();

              if (!response.ok) {
                alert(
                  data.detail ||
                    "Unable to activate SOS."
                );
                return;
              }

               alert(
  `${data.message || "SOS alert activated 🚨"}\n\n` +
  `Emergency contacts: ${data.contacts_count || 0}`
);
            } catch (error) {
              console.error(
                "SOS error:",
                error
              );

              alert(
                "Unable to connect to DearLove server."
              );
            }
          }}
        
        >
          🚨 ACTIVATE SOS
        </button>

      </div>

      <div style={styles.heroCard}>

        <div style={styles.heroIcon}>
          👥
        </div>

        <h2>
          Locations Shared With Me
        </h2>

        {sharedLocations.length === 0 ? (
          <p>
            No one has shared their location with you yet.
          </p>
        ) : (
          sharedLocations.map((shared) => (
            <div
              key={shared.share_id}
              style={styles.locationCard}
            >

              <p>
                📍 <strong>{shared.username}</strong>
              </p>

              <p>
                Latitude: {shared.latitude}
              </p>

              <p>
                Longitude: {shared.longitude}
              </p>

              {shared.created_at && (
                <p>
                  🕐 Updated:{" "}
                  {new Date(
                    shared.created_at
                  ).toLocaleString()}
                </p>
              )}

            </div>
          ))
        )}

      </div>

    </div>
  );
}
   
// =======================================================
// PEOPLE
// =======================================================

function People({
  users,
  search,
  setSearch,
  loading,
  error,
  onView,
  onConnect,
}) {
  return (
    <div>

      <h1>
        People 👥
      </h1>

      <p style={styles.subtitle}>
        Connect. Care. Love.
      </p>

      <div style={styles.sectionHeader}>

        <h2>
          Discover People
        </h2>

        <p>
          Find other DearLove users and
          start meaningful conversations.
        </p>

      </div>

      <input
        style={styles.search}
        placeholder="Search Users"
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

      {loading && (
        <p>
          Loading users...
        </p>
      )}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        users.length === 0 && (
          <div style={styles.empty}>
            No other users found.
          </div>
        )}

      <div style={styles.userGrid}>

        {users.map((user) => (
          <div
            key={user.user_id}
            style={styles.userCard}
          >

            <div style={styles.avatar}>
              {user.username
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

            <h3>
              {user.profile?.full_name ||
                user.username}
            </h3>

            <p>
              @{user.username}
            </p>

            <div style={styles.actionRow}>

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() =>
                  onView(user)
                }
              >
                View
              </button>

              <button
                type="button"
                style={styles.primaryButton}
                onClick={() =>
                  onConnect(user.user_id)
                }
              >
                👥 Connect
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

// =======================================================
// USER PROFILE
// =======================================================

function UserProfile({
  user,
  onBack,
  onLike,
  onMessage,
  onConnect,
}) {
  const profile = user.profile || {};

  return (
    <div>

      <button
        type="button"
        style={styles.backButton}
        onClick={onBack}
      >
        ← Back to People
      </button>

      <div style={styles.profileCard}>

        <div style={styles.profileAvatar}>

          {profile.profile_photo ? (
            <img
              src={profile.profile_photo}
              alt="Profile"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            user.username
              ?.charAt(0)
              ?.toUpperCase() || "U"
          )}

        </div>

        <h1>
          {profile.full_name ||
            user.username}
        </h1>

        <p style={styles.username}>
          @{user.username}
        </p>

        <div style={styles.profileInfo}>

          <p>
            📧 <strong>Email:</strong>{" "}
            {user.email ||
              "Not provided"}
          </p>

          <p>
            📝 <strong>Bio:</strong>{" "}
            {profile.bio ||
              "No bio available."}
          </p>

          <p>
            ⚧ <strong>Gender:</strong>{" "}
            {profile.gender ||
              "Not provided"}
          </p>

          <p>
            🎂 <strong>Date of Birth:</strong>{" "}
            {profile.date_of_birth ||
              "Not provided"}
          </p>

        </div>

        <div style={styles.actionRow}>

          <button
            type="button"
            style={styles.likeButton}
            onClick={() =>
              onLike(user.user_id)
            }
          >
            ❤️ Like
          </button>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={() =>
              onMessage(user)
            }
          >
            💬 Message
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() =>
              onConnect(user.user_id)
            }
          >
            👥 Connect
          </button>

        </div>

      </div>

    </div>
  );
}

// =======================================================
// MESSAGES
// =======================================================

function Messages({
  conversations,
  onOpen,
}) {
  return (
    <div>

      <h1>
        Messages 💬
      </h1>

      <p style={styles.subtitle}>
        Your conversations
      </p>

      {conversations.length === 0 ? (
        <div style={styles.empty}>
          No conversations yet.
        </div>
      ) : (
        <div>

          {conversations.map(
            (conversation) => (
              <div
                key={conversation.user_id}
                style={styles.conversationCard}
                onClick={() =>
                  onOpen(conversation)
                }
              >

                <div style={styles.avatar}>
                  {conversation.username
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </div>

                <div style={{ flex: 1 }}>

                  <strong>
                    {conversation.username}
                  </strong>

                  <p
                    style={
                      styles.lastMessage
                    }
                  >
                    {conversation.last_message ||
                      "No messages yet"}
                  </p>

                </div>

                {conversation.unread_count >
                  0 && (
                  <span
                    style={styles.badge}
                  >
                    {
                      conversation.unread_count
                    }
                  </span>
                )}

              </div>
            )
          )}

        </div>
      )}

    </div>
  );
}

// =======================================================
// CONVERSATION
// =======================================================

function Conversation({
  user,
  messages,
  messageText,
  setMessageText,
  onSend,
  onBack,
  currentUserId,
}) {
  return (
    <div
      style={
        styles.conversationPage
      }
    >

      <button
        type="button"
        style={styles.backButton}
        onClick={onBack}
      >
        ← Back to Messages
      </button>

      <div style={styles.chatHeader}>

        <div style={styles.chatAvatar}>
          {user.username
            ?.charAt(0)
            ?.toUpperCase() || "U"}
        </div>

        <div>

          <h2 style={{ margin: 0 }}>
            💬 {user.username}
          </h2>

          <div style={styles.chatStatus}>
            DearLove conversation
          </div>

        </div>

      </div>

      <div style={styles.messageBox}>

        {messages.length === 0 ? (
          <div style={styles.empty}>
            No messages yet. Say hello! ❤️
          </div>
        ) : (
          messages.map((message) => {

            const mine =
              message.sender_id ===
              currentUserId;

            return (
              <div
                key={message.message_id}
                style={{
                  ...styles.message,
                  ...(mine
                    ? styles.myMessage
                    : styles.theirMessage),
                }}
              >

                <div>
                  {message.content}
                </div>

                <div
                  style={
                    styles.messageTime
                  }
                >

                  {message.created_at
                    ? new Date(
                        message.created_at
                      ).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : ""}

                  {mine && (
                    <span
                      style={{
                        marginLeft: "5px",
                      }}
                    >
                      {message.is_read
                        ? "✓✓"
                        : "✓"}
                    </span>
                  )}

                </div>

              </div>
            );
          })
        )}

      </div>

      <div
        style={
          styles.messageInputRow
        }
      >

        <input
          style={styles.messageInput}
          placeholder="Write a message..."
          value={messageText}
          onChange={(e) =>
            setMessageText(
              e.target.value
            )
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSend();
            }
          }}
        />

        <button
          type="button"
          style={styles.primaryButton}
          onClick={onSend}
        >
          Send
        </button>

      </div>

    </div>
  );
}

// =======================================================
// MATCHES
// =======================================================

function Matches({
  matches,
  onMessage,
}) {
  return (
    <div>

      <h1>
        Matches ❤️
      </h1>

      <p style={styles.subtitle}>
        People who matched with you
      </p>

      {matches.length === 0 ? (
        <div style={styles.empty}>
          No matches yet.
        </div>
      ) : (
        <div style={styles.userGrid}>

          {matches.map((match) => (
            <div
              key={match.match_id}
              style={styles.userCard}
            >

              <div style={styles.avatar}>
                {match.username
                  ?.charAt(0)
                  ?.toUpperCase() || "U"}
              </div>

              <h3>
                {match.username}
              </h3>

              <p>
                It's a match! ❤️
              </p>

              <button
                type="button"
                style={styles.primaryButton}
                onClick={() =>
                  onMessage(match)
                }
              >
                💬 Message
              </button>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

// =======================================================
// PROFILE
// =======================================================

function Profile({ me }) {
  const [profile, setProfile] =
    useState(null);

  const [profileError, setProfileError] =
    useState("");

  const [profileLoading, setProfileLoading] =
    useState(true);

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [fullName, setFullName] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [gender, setGender] =
    useState("");

  const [dateOfBirth, setDateOfBirth] =
    useState("");

  const [profilePhoto, setProfilePhoto] =
    useState("");

  async function loadProfile() {
    const savedToken =
      localStorage.getItem(
        "dearlove_token"
      );

    if (!savedToken) {
      setProfileError(
        "No login token found."
      );

      setProfileLoading(false);
      return;
    }

    try {
      setProfileLoading(true);
      setProfileError("");

      const response = await fetch(
        `${API}/profile`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${savedToken}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load profile"
        );
      }

      setProfile(data);

      setFullName(
        data.full_name || ""
      );

      setBio(
        data.bio || ""
      );

      setGender(
        data.gender || ""
      );

      setDateOfBirth(
        data.date_of_birth || ""
      );

      setProfilePhoto(
        data.profile_photo || ""
      );
    } catch (err) {
      console.error(
        "Profile error:",
        err
      );

      setProfileError(
        err.message
      );
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function startEditing() {
    setSuccess("");
    setProfileError("");
    setEditing(true);
  }

  function cancelEditing() {
    setFullName(
      profile?.full_name || ""
    );

    setBio(
      profile?.bio || ""
    );

    setGender(
      profile?.gender || ""
    );

    setDateOfBirth(
      profile?.date_of_birth || ""
    );

    setProfilePhoto(
      profile?.profile_photo || ""
    );

    setSuccess("");
    setProfileError("");
    setEditing(false);
  }

  async function saveProfile() {
    const savedToken =
      localStorage.getItem(
        "dearlove_token"
      );

    if (!savedToken) {
      setProfileError(
        "No login token found."
      );
      return;
    }

    setSaving(true);
    setProfileError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${savedToken}`,
          },
          body: JSON.stringify({
            full_name: fullName,
            bio: bio,
            gender: gender,
            date_of_birth: dateOfBirth,
            profile_photo: profilePhoto,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to update profile"
        );
      }

      await loadProfile();

      setEditing(false);

      setSuccess(
        "Profile updated successfully! ❤️"
      );
    } catch (err) {
      console.error(
        "Update profile error:",
        err
      );

      setProfileError(
        err.message
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>

      <h1>
        My Profile 👤
      </h1>

      {profileLoading && (
        <p>
          Loading profile...
        </p>
      )}

      {profileError && (
        <div style={styles.error}>
          Profile error:{" "}
          {profileError}
        </div>
      )}

      {success && (
        <div style={styles.success}>
          {success}
        </div>
      )}

      {!profileLoading && (
        <div
          style={
            styles.profileCard
          }
        >

          <div
            style={
              styles.profileAvatar
            }
          >

            {profile?.profile_photo ? (
              <img
                src={
                  profile.profile_photo
                }
                alt="Profile"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              (
                fullName ||
                me?.username ||
                "U"
              )
                .charAt(0)
                .toUpperCase()
            )}

          </div>

          {!editing ? (
            <>

              <h2>
                {profile?.full_name ||
                  me?.username ||
                  "User"}
              </h2>

              <p
                style={
                  styles.username
                }
              >
                @{me?.username || ""}
              </p>

              <div
                style={
                  styles.profileInfo
                }
              >

                <p>
                  📧{" "}
                  <strong>
                    Email:
                  </strong>{" "}
                  {me?.email ||
                    "Not provided"}
                </p>

                <p>
                  📝{" "}
                  <strong>
                    Bio:
                  </strong>{" "}
                  {profile?.bio ||
                    "Not provided"}
                </p>

                <p>
                  ⚧{" "}
                  <strong>
                    Gender:
                  </strong>{" "}
                  {profile?.gender ||
                    "Not provided"}
                </p>

                <p>
                  🎂{" "}
                  <strong>
                    Date of Birth:
                  </strong>{" "}
                  {profile?.date_of_birth ||
                    "Not provided"}
                </p>

                <p>
                  🆔{" "}
                  <strong>
                    User ID:
                  </strong>{" "}
                  {me?.user_id ||
                    "Not available"}
                </p>

              </div>

              <button
                type="button"
                style={{
                  ...styles.primaryButton,
                  marginTop:
                    "20px",
                }}
                onClick={
                  startEditing
                }
              >
                ✏️ Edit Profile
              </button>

            </>
          ) : (
            <>

              <h2>
                Edit Your Profile ✏️
              </h2>

              <div
                style={
                  styles.profileForm
                }
              >

                <label
                  style={
                    styles.formLabel
                  }
                >
                  Full Name
                </label>

                <input
                  style={
                    styles.input
                  }
                  value={fullName}
                  placeholder="Enter your full name"
                  onChange={(e) =>
                    setFullName(
                      e.target.value
                    )
                  }
                />

                <label
                  style={
                    styles.formLabel
                  }
                >
                  Bio
                </label>

                <textarea
                  style={
                    styles.textarea
                  }
                  value={bio}
                  placeholder="Tell people about yourself..."
                  onChange={(e) =>
                    setBio(
                      e.target.value
                    )
                  }
                />

                <label
                  style={
                    styles.formLabel
                  }
                >
                  Gender
                </label>

                <select
                  style={
                    styles.input
                  }
                  value={gender}
                  onChange={(e) =>
                    setGender(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select gender
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Other">
                    Other
                  </option>

                  <option value="Prefer not to say">
                    Prefer not to say
                  </option>

                </select>

                <label
                  style={
                    styles.formLabel
                  }
                >
                  Date of Birth
                </label>

                <input
                  style={
                    styles.input
                  }
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) =>
                    setDateOfBirth(
                      e.target.value
                    )
                  }
                />

                <label
                  style={
                    styles.formLabel
                  }
                >
                  Profile Photo URL
                </label>

                <input
                  style={
                    styles.input
                  }
                  value={profilePhoto}
                  placeholder="Enter image URL"
                  onChange={(e) =>
                    setProfilePhoto(
                      e.target.value
                    )
                  }
                />

                <div
                  style={
                    styles.actionRow
                  }
                >

                  <button
                    type="button"
                    style={
                      styles.primaryButton
                    }
                    onClick={
                      saveProfile
                    }
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "💾 Save Changes"}
                  </button>

                  <button
                    type="button"
                    style={
                      styles.secondaryButton
                    }
                    onClick={
                      cancelEditing
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>

                </div>

              </div>

            </>
          )}

        </div>
      )}

    </div>
  );
}

// =======================================================
// NOTIFICATIONS
// =======================================================

function Notifications({
  token,
}) {
  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadNotifications() {
      try {
        const response =
          await fetch(
            `${API}/notifications`,
            {
              headers: {
                Authorization:
                  "Bearer " + token,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Unable to load notifications"
          );
        }

        setNotifications(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Notifications error:",
          err
        );

        setError(
          err.message
        );
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadNotifications();
    }
  }, [token]);

  return (
    <div>

      <h1>
        Notifications 🔔
      </h1>

      <p
        style={
          styles.subtitle
        }
      >
        Your latest DearLove
        notifications
      </p>

      {loading && (
        <p>
          Loading notifications...
        </p>
      )}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        notifications.length === 0 && (
          <div style={styles.empty}>
            No notifications yet. 🔔
          </div>
        )}

      {!loading &&
        !error &&
        notifications.length > 0 && (
          <div>

            {notifications.map(
              (notification) => (
                <div
                  key={
                    notification.id
                  }
                  style={
                    styles.conversationCard
                  }
                >

                  <div
                    style={
                      styles.avatar
                    }
                  >
                    🔔
                  </div>

                  <div
                    style={{
                      flex: 1,
                    }}
                  >

                    <strong>
                      {notification.title ||
                        "DearLove Notification"}
                    </strong>

                    <p
                      style={
                        styles.lastMessage
                      }
                    >
                      {notification.message ||
                        notification.content ||
                        "You have a new notification."}
                    </p>

                  </div>

                </div>
              )
            )}

          </div>
        )}

    </div>
  );
}

// =======================================================
// EMERGENCY CONTACTS
// =======================================================

function EmergencyContacts({ token }) {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadContacts() {
    try {
      const response = await fetch(
        `${API}/emergency-contacts`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load contacts"
        );
      }

      setContacts(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Emergency contacts error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadContacts();
    }
  }, [token]);

  async function addContact() {
    if (!name.trim() || !phone.trim()) {
      alert("Please enter name and phone number.");
      return;
    }

    try {
      const params = new URLSearchParams();

      params.append(
        "contact_name",
        name.trim()
      );

      params.append(
        "contact_phone",
        phone.trim()
      );

      const response = await fetch(
        `${API}/emergency-contacts?${params.toString()}`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
            "Unable to add emergency contact."
        );
        return;
      }

      setName("");
      setPhone("");

      await loadContacts();

      alert(
        "Emergency contact added successfully ❤️"
      );
    } catch (error) {
      console.error(
        "Add emergency contact error:",
        error
      );

      alert(
        "Unable to connect to DearLove server."
      );
    }
  }

  return (
    <div>

      <h1>
        Emergency Contacts 🚨
      </h1>

      <p style={styles.subtitle}>
        People who can help you during an emergency.
      </p>

      <div style={styles.heroCard}>

        <h2>
          Add Emergency Contact
        </h2>

        <input
          style={styles.search}
          placeholder="Contact name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <input
          style={{
            ...styles.search,
            marginTop: "10px",
          }}
          placeholder="Phone number"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
        />

        <button
          type="button"
          style={styles.primaryButton}
          onClick={addContact}
        >
          ➕ Add Emergency Contact
        </button>

      </div>

      <div style={styles.heroCard}>

        <h2>
          My Emergency Contacts
        </h2>

        {loading ? (
          <p>
            Loading contacts...
          </p>
        ) : contacts.length === 0 ? (
          <p style={styles.empty}>
            No emergency contacts added yet.
          </p>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              style={styles.conversationCard}
            >

              <div style={styles.avatar}>
                🚨
              </div>

              <div>
                <strong>
                  {contact.contact_name}
                </strong>

                <p style={styles.lastMessage}>
                  📞 {contact.contact_phone}
                </p>
              </div>

            </div>
          ))
        )}

      </div>

    </div>
  );
}

// =======================================================
// CONNECTIONS
// =======================================================

 function Connections({
  requests,
  loading,
  sentRequests,
  sentLoading,
  onAccept,
  onReject,
}) {
  return (
    <div>

      <h1>
        Connections 👥
      </h1>

      <p style={styles.subtitle}>
        Manage your connection requests.
      </p>

      {/* RECEIVED REQUESTS */}

      <div style={styles.heroCard}>

        <h2>
          📥 Incoming Requests
        </h2>

        {loading ? (
          <p>Loading connection requests...</p>
        ) : requests.length === 0 ? (
          <div style={styles.empty}>
            No incoming requests yet. 👥
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.connection_id}
              style={styles.conversationCard}
            >

              <div style={styles.avatar}>
                {(request.username ||
                  request.sender_username ||
                  "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>

                <strong>
                  {request.username ||
                    request.sender_username ||
                    "DearLove User"}
                </strong>

                <p style={styles.lastMessage}>
                  Wants to connect with you. ❤️
                </p>

                <div style={styles.actionRow}>

                  <button
                    type="button"
                    style={styles.primaryButton}
                    onClick={() =>
                      onAccept(
                        request.connection_id
                      )
                    }
                  >
                    ✅ Accept
                  </button>

                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() =>
                      onReject(
                        request.connection_id
                      )
                    }
                  >
                    ❌ Reject
                  </button>

                </div>

              </div>

            </div>
          ))
        )}

      </div>

      {/* SENT REQUESTS */}

      <div style={styles.heroCard}>

        <h2>
          📤 Sent Requests
        </h2>

        {sentLoading ? (
          <p>Loading sent requests...</p>
        ) : sentRequests.length === 0 ? (
          <div style={styles.empty}>
            You haven't sent any connection requests yet.
          </div>
        ) : (
          sentRequests.map((request) => (
            <div
              key={request.connection_id}
              style={styles.conversationCard}
            >

              <div style={styles.avatar}>
                {(request.username ||
                  request.receiver_username ||
                  "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>

                <strong>
                  {request.username ||
                    request.receiver_username ||
                    "DearLove User"}
                </strong>

                <p style={styles.lastMessage}>
                  📤 Connection request sent.
                </p>

                <span style={styles.badge}>
                  {request.status ||
                    "pending"}
                </span>

              </div>

            </div>
          ))
        )}

      </div>

    </div>
  );
}

// =======================================================
// SETTINGS
// =======================================================

function Settings({
  logout,
}) {
  return (
    <div>

      <h1>
        Settings ⚙️
      </h1>

      <div
        style={
          styles.settingsCard
        }
      >

        <h2>
          Account
        </h2>

        <p>
          Manage your DearLove
          account.
        </p>

        <button
          type="button"
          style={
            styles.logoutButtonLarge
          }
          onClick={logout}
        >
          🚪 Logout
        </button>

      </div>

    </div>
  );
}

// =======================================================
// STAT CARD
// =======================================================

function StatCard({
  icon,
  title,
  value,
}) {
  return (
    <div
      style={
        styles.statCard
      }
    >

      <div
        style={
          styles.statIcon
        }
      >
        {icon}
      </div>

      <div>

        <div
          style={
            styles.statValue
          }
        >
          {value}
        </div>

        <div
          style={
            styles.statTitle
          }
        >
          {title}
        </div>

      </div>

    </div>
  );
}

// =======================================================
// STYLES
// =======================================================

const styles = {
  app: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    background: "#f7f7fb",
    color: "#222",
    boxSizing: "border-box",
  },

  sidebar: {
    width: "240px",
    minHeight: "100vh",
    padding: "25px 18px",
    boxSizing: "border-box",
    background: "#ffffff",
    borderRight:
      "1px solid #e5e5e5",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  logo: {
    fontSize: "25px",
    fontWeight: "bold",
    marginBottom: "5px",
  },

  tagline: {
    color: "#777",
    marginBottom: "20px",
  },

  navButton: {
    border: "none",
    background: "transparent",
    padding: "13px",
    textAlign: "left",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
  },

  logoutButton: {
    border: "none",
    background: "#222",
    color: "white",
    padding: "12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "15px",
  },

  main: {
    flex: 1,
    padding: "40px",
    maxWidth: "1200px",
  },

  subtitle: {
    color: "#777",
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    margin: "30px 0",
  },

  statCard: {
    background: "white",
    padding: "25px",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.06)",
  },

  statIcon: {
    fontSize: "30px",
  },

  statValue: {
    fontSize: "28px",
    fontWeight: "bold",
  },

  statTitle: {
    color: "#777",
  },

  heroCard: {
    background: "white",
    padding: "40px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.06)",
    marginBottom: "25px",
  },

  heroIcon: {
    fontSize: "50px",
  },

  primaryButton: {
    border: "none",
    background: "#222",
    color: "white",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "15px",
  },

  secondaryButton: {
    border: "1px solid #ddd",
    background: "white",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  likeButton: {
    border: "none",
    background: "#ffebee",
    color: "#d32f2f",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "15px",
  },

  search: {
    width: "100%",
    maxWidth: "500px",
    padding: "14px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    margin: "20px 0 30px",
    boxSizing: "border-box",
    fontSize: "16px",
  },

  userGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },

  userCard: {
    background: "white",
    padding: "25px",
    borderRadius: "15px",
    textAlign: "center",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.06)",
  },

  avatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "#eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 15px",
    fontSize: "24px",
    fontWeight: "bold",
  },

  profileCard: {
    background: "white",
    padding: "35px",
    borderRadius: "20px",
    maxWidth: "650px",
    marginTop: "25px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.06)",
  },

  profileAvatar: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    background: "#eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    fontWeight: "bold",
    marginBottom: "20px",
    overflow: "hidden",
  },

  username: {
    color: "#777",
  },

  profileInfo: {
    marginTop: "25px",
    lineHeight: "1.8",
  },

  locationCard: {
    padding: "16px",
    marginTop: "15px",
    marginBottom: "15px",
    borderRadius: "12px",
    background: "#f5f5f5",
  },

  profileForm: {
    marginTop: "25px",
  },

  formLabel: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "7px",
    marginTop: "15px",
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    padding: "14px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    fontSize: "16px",
    boxSizing: "border-box",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    resize: "vertical",
  },

  actionRow: {
    display: "flex",
    gap: "12px",
    marginTop: "25px",
    flexWrap: "wrap",
  },

  backButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "16px",
    padding: "8px 0",
  },

  empty: {
    background: "white",
    padding: "30px",
    borderRadius: "15px",
    textAlign: "center",
    color: "#777",
  },

  error: {
    background: "#ffebee",
    color: "#c62828",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  success: {
    background: "#e8f5e9",
    color: "#2e7d32",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  conversationCard: {
    background: "white",
    padding: "18px",
    borderRadius: "12px",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    cursor: "pointer",
    boxShadow:
      "0 2px 10px rgba(0,0,0,0.05)",
  },

  lastMessage: {
    margin: "5px 0 0",
    color: "#777",
  },

  badge: {
    background: "#222",
    color: "white",
    minWidth: "25px",
    height: "25px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
  },

  conversationPage: {
    maxWidth: "800px",
  },

  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginTop: "15px",
    marginBottom: "10px",
  },

  chatAvatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "#eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "bold",
  },

  chatStatus: {
    color: "#777",
    fontSize: "13px",
    marginTop: "3px",
  },

  messageBox: {
    background: "white",
    borderRadius: "15px",
    padding: "20px",
    minHeight: "400px",
    maxHeight: "500px",
    overflowY: "auto",
    marginTop: "20px",
  },

  message: {
    padding: "12px 16px",
    borderRadius: "15px",
    marginBottom: "10px",
    maxWidth: "70%",
    wordBreak: "break-word",
  },

  myMessage: {
    marginLeft: "auto",
    background: "#222",
    color: "white",
  },

  theirMessage: {
    marginRight: "auto",
    background: "#eee",
  },

  messageTime: {
    fontSize: "11px",
    opacity: 0.6,
    marginTop: "5px",
    textAlign: "right",
  },

  messageInputRow: {
    display: "flex",
    gap: "10px",
    marginTop: "15px",
  },

  messageInput: {
    flex: 1,
    padding: "14px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    fontSize: "16px",
  },

  settingsCard: {
    background: "white",
    padding: "30px",
    borderRadius: "15px",
    maxWidth: "600px",
  },

  logoutButtonLarge: {
    border: "none",
    background: "#222",
    color: "white",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  loginPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f7f7fb",
  },

  loginCard: {
    width: "380px",
    maxWidth: "90%",
    background: "white",
    padding: "40px",
    borderRadius: "20px",
    boxShadow:
      "0 5px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
  },

  bigHeart: {
    fontSize: "55px",
  },

  input: {
    width: "100%",
    padding: "14px",
    marginBottom: "15px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    boxSizing: "border-box",
    fontSize: "16px",
  },

  sectionHeader: {
    marginTop: "20px",
  },
};

export default App;