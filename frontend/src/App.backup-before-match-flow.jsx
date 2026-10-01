  import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import Peer from "simple-peer";
import "leaflet/dist/leaflet.css";

const API = "http://127.0.0.1:8000";

// =======================================================
// APP
// =======================================================

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("dearlove_token")
  );

const [callType, setCallType] = useState(null);
const [callActive, setCallActive] = useState(false);
const [callIncoming, setCallIncoming] = useState(false);
const [callUser, setCallUser] = useState(null);
const [incomingOffer, setIncomingOffer] = useState(null);



const peerRef = useRef(null);
const localStreamRef = useRef(null);
const remoteStreamRef = useRef(null);
const callWsRef = useRef(null);
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
const [unreadNotifications, setUnreadNotifications] = useState(0);

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
                   alert("Location saved successfully! ðŸ“");
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
await loadSentConnections();
loadUnreadNotifications();

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
          "User liked successfully â¤ï¸"
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

async function loadUnreadNotifications() {
  if (!token) return;

  try {
    const response = await fetch(
      `${API}/notifications/unread/count`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    if (!response.ok) return;

    const data = await response.json();

    setUnreadNotifications(
      data.unread_count ??
      data.count ??
      0
    );

  } catch (err) {
    console.error(
      "Unread notifications error:",
      err
    );
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
loadUnreadNotifications();
 }, [token]);

  // =====================================================
  // CALL SIGNALING CONNECTION
  // =====================================================

  useEffect(() => {
    if (!token || !me?.user_id) {
      return;
    }

     const wsProtocol =
    window.location.protocol === "https:"
      ? "wss:"
      : "ws:";

  const wsUrl =
    `${wsProtocol}//127.0.0.1:8000/ws/call/${me.user_id}`;


const ws = new WebSocket(wsUrl);


callWsRef.current = ws;

ws.onopen = () => {
  console.log("Call signaling connection ready");
};
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        console.log("Incoming call signaling:", data);

        
if (data.type === "offer") {
  setIncomingOffer(data.offer);

  setCallIncoming(true);

  setCallUser({
    user_id: data.sender_id,
    username:
      data.sender_username || "DearLove User",
  });

  setCallType(
    data.call_type || "voice"
  );
}

      } catch (error) {
        console.error("Call signaling message error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("Call signaling connection error:", error);
    };

    
ws.onclose = () => {
  console.log("Call signaling connection closed");

  if (callWsRef.current === ws) {
    callWsRef.current = null;
  }
};
    return () => {
      ws.close();
    };
  }, [token, me?.user_id]);


  // =====================================================
  // MESSAGE AUTO REFRESH
  // =====================================================

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      loadUnreadNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, [token]);
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

{callIncoming && !callActive && callUser && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9998,
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}
  >
    <div
      style={{
        background: "white",
        color: "#111827",
        borderRadius: "20px",
        padding: "30px",
        width: "min(90vw, 400px)",
        textAlign: "center",
        boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ fontSize: "50px" }}>
        {callType === "video" ? "ðŸ“¹" : "ðŸ“ž"}
      </div>

      <h2>Incoming Call</h2>

      <p style={{ fontSize: "18px" }}>
        {callUser.username || "DearLove User"} is calling you
      </p>

      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          marginTop: "25px",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setCallIncoming(false);
            setCallActive(true);
          }}
          style={{
            padding: "12px 22px",
            border: "none",
            borderRadius: "25px",
            background: "#16a34a",
            color: "white",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          âœ… Accept
        </button>

        <button
          type="button"
          onClick={() => {
            setCallIncoming(false);
            setCallUser(null);
            setCallType(null);
            setIncomingOffer(null);
          }}
          style={{
            padding: "12px 22px",
            border: "none",
            borderRadius: "25px",
            background: "#dc2626",
            color: "white",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          âŒ Decline
        </button>
      </div>
    </div>
  </div>
)}

{callActive && callUser && (
 

<CallScreen
  user={callUser}
  callType={callType}
  currentUserId={me?.user_id}
  me={me}
  incomingOffer={incomingOffer}
  callWsRef={callWsRef}
 onEnd={() => {
      setCallActive(false);
      setCallUser(null);
      setCallType(null);
setIncomingOffer(null);
    }}
  />
)}
      <aside style={styles.sidebar}>

        <div style={styles.logo}>
          â¤ï¸ DearLove
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
          ðŸ  Home
        </button>

         <button
  type="button"
  style={styles.navButton}
  onClick={() => {
    setPage("notifications");
    loadUnreadNotifications();
  }}
>
  ðŸ”” Notifications
  {unreadNotifications > 0 && (
    <span style={styles.badge}>
      {unreadNotifications}
    </span>
  )}
</button>

        <button
          type="button"
          style={styles.navButton}
          onClick={() => {
            setPage("messages");
            loadConversations();
          }}
        >
          ðŸ’¬ Messages
        </button>

        <button
          type="button"
          style={styles.navButton}
          onClick={() => {
            setPage("people");
            loadUsers();
          }}
        >
          ðŸ‘¥ People
        </button>

        <button
          type="button"
          style={styles.navButton}
          onClick={() => {
            setPage("matches");
            loadMatches();
          }}
        >
          â¤ï¸ Matches
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
  ðŸ‘¥ Connections
</button>

        <button
          type="button"
          style={styles.navButton}
          onClick={() =>
            setPage("profile")
          }
        >
          ðŸ‘¤ Profile
        </button>

        <button
          type="button"
          style={styles.navButton}
          onClick={() =>
            setPage("settings")
          }
        >
          âš™ï¸ Settings
        </button>
<button
  type="button"
  style={styles.navButton}
  onClick={() =>
    setPage("emergency-contacts")
  }
>
  ðŸš¨ Emergency Contacts
</button>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          style={styles.logoutButton}
          onClick={logout}
        >
          ðŸšª Logout
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
  setCallUser={setCallUser}
  setCallType={setCallType}
  setCallActive={setCallActive}
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
  <Settings
    logout={logout}
    token={token}
    me={me}
  />
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
          â¤ï¸
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
        Welcome to DearLove â¤ï¸
      </h1>

      <p style={styles.subtitle}>
        Hello, {me?.username || "User"}!
      </p>

      <div style={styles.cards}>

        <StatCard
          icon="ðŸ’¬"
          title="Messages"
          value={conversations.length}
        />

        <StatCard
          icon="â¤ï¸"
          title="Matches"
          value={matches.length}
        />

        <StatCard
          icon="ðŸ‘¥"
          title="People"
          value={users.length}
        />

      </div>

      <div style={styles.heroCard}>

        <div style={styles.heroIcon}>
          â¤ï¸
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
          ðŸ“
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
              ðŸ“{" "}
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
                ðŸ• Saved:{" "}
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
          ðŸ“ Save My Location
        </button>
{location && (
  <LocationMap
    latitude={location.latitude}
    longitude={location.longitude}
    title="My Location"
  />
)}
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
          "Location sharing enabled successfully! ðŸ“â¤ï¸"
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
  ðŸ“ Share My Location
</button>
      </div>

      <div style={styles.heroCard}>

        <div style={styles.heroIcon}>
          ðŸš¨
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
              "Are you sure you want to activate SOS? ðŸš¨"
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
  `${data.message || "SOS alert activated ðŸš¨"}\n\n` +
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
          ðŸš¨ ACTIVATE SOS
        </button>

      </div>

      <div style={styles.heroCard}>

        <div style={styles.heroIcon}>
          ðŸ‘¥
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
                ðŸ“ <strong>{shared.username}</strong>
              </p>

              <p>
                Latitude: {shared.latitude}
              </p>

              <p>
                Longitude: {shared.longitude}
              </p>

              {shared.created_at && (
                <p>
                  ðŸ• Updated:{" "}
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
// USER SAFETY ACTIONS
// =======================================================

function UserSafetyActions({
  user,
  token,
  onBlocked,
}) {
  const [showReport, setShowReport] = React.useState(false);
  const [reason, setReason] = React.useState("spam");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const blockUser = async () => {
    if (!window.confirm(`Block @${user.username}?`)) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/users/block",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.user_id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not block user."
        );
      }

      setMessage("User blocked successfully.");

      if (onBlocked) {
        onBlocked(user.user_id);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const reportUser = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/users/report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.user_id,
            reason,
            description,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Could not submit report."
        );
      }

      setMessage("Report submitted successfully.");
      setDescription("");
      setShowReport(false);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "20px",
        paddingTop: "15px",
        borderTop: "1px solid #ddd",
      }}
    >

      <div style={styles.actionRow}>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={blockUser}
          disabled={loading}
        >
          ðŸš« Block
        </button>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() =>
            setShowReport(!showReport)
          }
          disabled={loading}
        >
          âš ï¸ Report
        </button>

      </div>

      {showReport && (
        <div
          style={{
            marginTop: "15px",
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >

          <h3>Report User</h3>

          <select
            value={reason}
            onChange={(e) =>
              setReason(e.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          >
            <option value="spam">Spam</option>
            <option value="harassment">
              Harassment
            </option>
            <option value="fake_profile">
              Fake Profile
            </option>
            <option value="inappropriate">
              Inappropriate Content
            </option>
            <option value="scam">
              Scam / Fraud
            </option>
            <option value="other">
              Other
            </option>
          </select>

          <textarea
            placeholder="Describe the problem (optional)"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            rows={4}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "10px",
            }}
          >

            <button
              type="button"
              style={styles.primaryButton}
              onClick={reportUser}
              disabled={loading}
            >
              {loading
                ? "Submitting..."
                : "Submit Report"}
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() =>
                setShowReport(false)
              }
              disabled={loading}
            >
              Cancel
            </button>

          </div>

        </div>
      )}

      {message && (
        <p
          style={{
            marginTop: "10px",
            fontWeight: "600",
          }}
        >
          {message}
        </p>
      )}

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
  token,
  onBlocked,
}) {
  return (
    <div>

      <h1>
        People ðŸ‘¥
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
                ðŸ‘¥ Connect
              </button>

            </div>

            <UserSafetyActions
              user={user}
              token={token}
              onBlocked={onBlocked}
            />

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
  token,
  onBlocked,
}) {
  const profile = user.profile || {};

  return (
    <div>

      <button
        type="button"
        style={styles.backButton}
        onClick={onBack}
      >
        â† Back to People
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
            ðŸ“§ <strong>Email:</strong>{" "}
            {user.email ||
              "Not provided"}
          </p>

          <p>
            ðŸ“ <strong>Bio:</strong>{" "}
            {profile.bio ||
              "No bio available."}
          </p>

          <p>
            âš§ <strong>Gender:</strong>{" "}
            {profile.gender ||
              "Not provided"}
          </p>

          <p>
            ðŸŽ‚ <strong>Date of Birth:</strong>{" "}
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
            â¤ï¸ Like
          </button>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={() =>
              onMessage(user)
            }
          >
            ðŸ’¬ Message
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() =>
              onConnect(user.user_id)
            }
          >
            ðŸ‘¥ Connect
          </button>

        </div>

        <UserSafetyActions
          user={user}
          token={token}
          onBlocked={onBlocked}
        />

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
        Messages ðŸ’¬
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
setCallUser,
  setCallType,
  setCallActive,
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
        â† Back to Messages
      </button>

      <div style={styles.chatHeader}>

        <div style={styles.chatAvatar}>
          {user.username
            ?.charAt(0)
            ?.toUpperCase() || "U"}
        </div>

        <div>

          <h2 style={{ margin: 0 }}>
            ðŸ’¬ {user.username}
          </h2>

          <div style={styles.chatStatus}>
            DearLove conversation
          </div>

        </div>

      </div>

      <div style={styles.messageBox}>

        {messages.length === 0 ? (
          <div style={styles.empty}>
            No messages yet. Say hello! â¤ï¸
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
                        ? "âœ“âœ“"
                        : "âœ“"}
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
<div
  style={{
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  }}
>
  <button
    type="button"
    style={styles.primaryButton}
     onClick={() => {
  setCallUser(user);
  setCallType("voice");
  setCallActive(true);
}}
  >
    ðŸ“ž Voice Call
  </button>

  <button
    type="button"
    style={styles.primaryButton}
     onClick={() => {
  setCallUser(user);
  setCallType("video");
  setCallActive(true);
}}
  >
    ðŸ“¹ Video Call
  </button>
</div>

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
        Matches â¤ï¸
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
                It's a match! â¤ï¸
              </p>

              <button
                type="button"
                style={styles.primaryButton}
                onClick={() =>
                  onMessage(match)
                }
              >
                ðŸ’¬ Message
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
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState("");

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");

  async function loadProfile() {
    const savedToken =
      localStorage.getItem("dearlove_token");

    if (!savedToken) {
      setProfileError("No login token found.");
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
            Authorization: `Bearer ${savedToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load profile"
        );
      }

      setProfile(data);

      setFullName(data.full_name || "");
      setBio(data.bio || "");
      setGender(data.gender || "");
      setDateOfBirth(data.date_of_birth || "");
      setProfilePhoto(data.profile_photo || "");
    } catch (err) {
      console.error(
        "Profile error:",
        err
      );

      setProfileError(
        err.message ||
          "Unable to load profile."
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
            date_of_birth:
              dateOfBirth,
            profile_photo:
              profilePhoto,
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
        err.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    const firstConfirm = window.confirm(
      "⚠️ DELETE ACCOUNT\n\n" +
      "This will permanently delete your DearLove account and profile.\n\n" +
      "This action cannot be undone.\n\n" +
      "Do you want to continue?"
    );

    if (!firstConfirm) {
      return;
    }

    const secondConfirm = window.prompt(
      'Type DELETE to permanently delete your account:'
    );

    if (secondConfirm !== "DELETE") {
      alert(
        "Account deletion cancelled."
      );
      return;
    }

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

    try {
      setDeleting(true);
      setProfileError("");
      setSuccess("");

      const response = await fetch(
        `${API}/profile`,
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${savedToken}`,
          },
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to delete account."
        );
      }

      localStorage.removeItem(
        "dearlove_token"
      );

      alert(
        "Your DearLove account has been deleted."
      );

      window.location.reload();
    } catch (err) {
      console.error(
        "Delete account error:",
        err
      );

      setProfileError(
        err.message ||
          "Unable to delete account."
      );
    } finally {
      setDeleting(false);
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

              <div
                style={{
                  ...styles.actionRow,
                  marginTop: "20px",
                }}
              >

                <button
                  type="button"
                  style={
                    styles.primaryButton
                  }
                  onClick={
                    startEditing
                  }
                  disabled={deleting}
                >
                  ✏️ Edit Profile
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.secondaryButton,
                    border:
                      "1px solid #dc2626",
                    color: "#dc2626",
                    background:
                      "#fff5f5",
                  }}
                  onClick={
                    deleteAccount
                  }
                  disabled={deleting}
                >
                  {deleting
                    ? "Deleting..."
                    : "🗑️ Delete Account"}
                </button>

              </div>

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
                  disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
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

 function Notifications({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/notifications`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load notifications"
        );
      }

      setNotifications(
        Array.isArray(data) ? data : []
      );

      await loadUnreadCount();

    } catch (err) {
      console.error(
        "Notifications error:",
        err
      );

      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadUnreadCount() {
    try {
      const response = await fetch(
        `${API}/notifications/unread/count`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      setUnreadCount(
        data.unread_count ??
        data.count ??
        0
      );

    } catch (err) {
      console.error(
        "Unread notification count error:",
        err
      );
    }
  }

  async function markAsRead(notificationId) {
    try {
      const response = await fetch(
        `${API}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) return;

      await loadNotifications();

    } catch (err) {
      console.error(
        "Mark notification read error:",
        err
      );
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch(
        `${API}/notifications/read-all`,
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
            "Unable to mark notifications as read."
        );
        return;
      }

      await loadNotifications();

      alert(
        "All notifications marked as read. âœ…"
      );

    } catch (err) {
      console.error(
        "Mark all notifications error:",
        err
      );

      alert(
        "Unable to connect to DearLove server."
      );
    }
  }

  async function deleteNotification(notificationId) {
    try {
      const response = await fetch(
        `${API}/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.detail ||
            "Unable to delete notification."
        );
        return;
      }

      await loadNotifications();

    } catch (err) {
      console.error(
        "Delete notification error:",
        err
      );

      alert(
        "Unable to connect to DearLove server."
      );
    }
  }

  useEffect(() => {
    if (token) {
      loadNotifications();
    }
  }, [token]);

  return (
    <div>

      <h1>
        Notifications ðŸ””
      </h1>

      <p style={styles.subtitle}>
        Your latest DearLove notifications
      </p>

      <div style={styles.actionRow}>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={loadNotifications}
        >
          ðŸ”„ Refresh
        </button>

        {unreadCount > 0 && (
          <button
            type="button"
            style={styles.primaryButton}
            onClick={markAllAsRead}
          >
            âœ… Mark All as Read
          </button>
        )}

      </div>

      {unreadCount > 0 && (
        <div style={styles.success}>
          ðŸ”” You have {unreadCount} unread notification
          {unreadCount === 1 ? "" : "s"}.
        </div>
      )}

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
            No notifications yet. ðŸ””
          </div>
        )}

      {!loading &&
        !error &&
        notifications.length > 0 && (
          <div>

            {notifications.map(
              (notification) => {

                const notificationId =
                  notification.id ??
                  notification.notification_id;

                const isRead =
                  notification.is_read ??
                  notification.read ??
                  false;

                return (
                  <div
                    key={notificationId}
                    style={{
                      ...styles.conversationCard,
                      opacity: isRead ? 0.7 : 1,
                    }}
                  >

                    <div style={styles.avatar}>
                      ðŸ””
                    </div>

                    <div style={{ flex: 1 }}>

                      <strong>
                        {notification.title ||
                          "DearLove Notification"}
                      </strong>

                      <p style={styles.lastMessage}>
                        {notification.message ||
                          notification.content ||
                          "You have a new notification."}
                      </p>

                      <div style={styles.actionRow}>

                        {!isRead && (
                          <button
                            type="button"
                            style={styles.primaryButton}
                            onClick={() =>
                              markAsRead(
                                notificationId
                              )
                            }
                          >
                            âœ… Mark as Read
                          </button>
                        )}

                        <button
                          type="button"
                          style={styles.secondaryButton}
                          onClick={() =>
                            deleteNotification(
                              notificationId
                            )
                          }
                        >
                          ðŸ—‘ï¸ Delete
                        </button>

                      </div>

                    </div>

                  </div>
                );
              }
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
        "Emergency contact added successfully â¤ï¸"
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
        Emergency Contacts ðŸš¨
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
          âž• Add Emergency Contact
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
                ðŸš¨
              </div>

              <div>
                <strong>
                  {contact.contact_name}
                </strong>

                <p style={styles.lastMessage}>
                  ðŸ“ž {contact.contact_phone}
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
        Connections ðŸ‘¥
      </h1>

      <p style={styles.subtitle}>
        Manage your connection requests.
      </p>

      {/* RECEIVED REQUESTS */}

      <div style={styles.heroCard}>

        <h2>
          ðŸ“¥ Incoming Requests
        </h2>

        {loading ? (
          <p>Loading connection requests...</p>
        ) : requests.length === 0 ? (
          <div style={styles.empty}>
            No incoming requests yet. ðŸ‘¥
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
                  Wants to connect with you. â¤ï¸
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
                    âœ… Accept
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
                    âŒ Reject
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
          ðŸ“¤ Sent Requests
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
                  ðŸ“¤ Connection request sent.
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
  token,
  me,
}) {
  const [settings, setSettings] = React.useState({
    notifications_enabled: true,
    message_notifications: true,
    location_sharing_enabled: true,
    show_online_status: true,
    profile_discoverable: true,
  });

  const [blockedUsers, setBlockedUsers] = React.useState([]);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [adminStats, setAdminStats] = React.useState(null);
  const [adminUsers, setAdminUsers] = React.useState([]);
  const [adminReports, setAdminReports] = React.useState([]);

  const [loading, setLoading] = React.useState(true);
  const [adminLoading, setAdminLoading] = React.useState(false);

  const [reportUserId, setReportUserId] = React.useState("");
  const [reportReason, setReportReason] = React.useState("Other");
  const [reportDescription, setReportDescription] = React.useState("");

  const [message, setMessage] = React.useState("");

  async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.detail || "Request failed"
      );
    }

    return data;
  }

  async function loadSettings() {
    try {
      const data = await apiFetch(
        `${API}/settings`
      );

      setSettings({
        notifications_enabled:
          data.notifications_enabled ?? true,

        message_notifications:
          data.message_notifications ?? true,

        location_sharing_enabled:
          data.location_sharing_enabled ?? true,

        show_online_status:
          data.show_online_status ?? true,

        profile_discoverable:
          data.profile_discoverable ?? true,
      });
    } catch (error) {
      console.error(
        "Settings loading error:",
        error
      );
    }
  }

  async function loadBlockedUsers() {
    try {
      const data = await apiFetch(
        `${API}/users/blocked`
      );

      setBlockedUsers(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Blocked users loading error:",
        error
      );
    }
  }

  async function checkAdmin() {
    try {
      const data = await apiFetch(
        `${API}/admin/me`
      );

      setIsAdmin(
        data.is_admin === true
      );

      return data.is_admin === true;
    } catch (error) {
      setIsAdmin(false);
      return false;
    }
  }

  async function loadAdminData() {
    try {
      setAdminLoading(true);

      const [
        stats,
        users,
        reports,
      ] = await Promise.all([
        apiFetch(`${API}/admin/stats`),
        apiFetch(`${API}/admin/users`),
        apiFetch(`${API}/admin/reports`),
      ]);

      setAdminStats(stats);
      setAdminUsers(
        Array.isArray(users) ? users : []
      );
      setAdminReports(
        Array.isArray(reports) ? reports : []
      );
    } catch (error) {
      console.error(
        "Admin loading error:",
        error
      );
    } finally {
      setAdminLoading(false);
    }
  }

  React.useEffect(() => {
    async function loadEverything() {
      setLoading(true);

      await Promise.all([
        loadSettings(),
        loadBlockedUsers(),
      ]);

      const admin = await checkAdmin();

      if (admin) {
        await loadAdminData();
      }

      setLoading(false);
    }

    if (token) {
      loadEverything();
    }
  }, [token]);

  async function updateSetting(
    name,
    value
  ) {
    const newSettings = {
      ...settings,
      [name]: value,
    };

    setSettings(newSettings);

    try {
      await apiFetch(
        `${API}/settings`,
        {
          method: "PUT",
          body: JSON.stringify({
            [name]: value,
          }),
        }
      );

      setMessage(
        "Settings saved successfully."
      );

      setTimeout(
        () => setMessage(""),
        2000
      );
    } catch (error) {
      console.error(error);

      setSettings(settings);

      setMessage(
        "Unable to save setting."
      );
    }
  }

  async function unblockUser(
    userId
  ) {
    try {
      await apiFetch(
        `${API}/users/block/${userId}`,
        {
          method: "DELETE",
        }
      );

      setBlockedUsers(
        blockedUsers.filter(
          user => user.id !== userId
        )
      );

      setMessage(
        "User unblocked successfully."
      );
    } catch (error) {
      alert(error.message);
    }
  }

  async function submitReport() {
    if (!reportUserId) {
      alert(
        "Enter the user ID you want to report."
      );
      return;
    }

    try {
      await apiFetch(
        `${API}/users/report`,
        {
          method: "POST",
          body: JSON.stringify({
            user_id: Number(reportUserId),
            reason: reportReason,
            description:
              reportDescription || null,
          }),
        }
      );

      setReportUserId("");
      setReportReason("Other");
      setReportDescription("");

      setMessage(
        "Report submitted successfully."
      );
    } catch (error) {
      alert(error.message);
    }
  }

  async function suspendUser(
    userId
  ) {
    const reason =
      window.prompt(
        "Reason for suspension:"
      );

    if (reason === null) {
      return;
    }

    try {
      await apiFetch(
        `${API}/admin/users/${userId}/suspend`,
        {
          method: "POST",
          body: JSON.stringify({
            reason: reason || "Policy violation",
            expires_at: null,
          }),
        }
      );

      await loadAdminData();
    } catch (error) {
      alert(error.message);
    }
  }

  async function unsuspendUser(
    userId
  ) {
    try {
      await apiFetch(
        `${API}/admin/users/${userId}/unsuspend`,
        {
          method: "POST",
        }
      );

      await loadAdminData();
    } catch (error) {
      alert(error.message);
    }
  }

  async function promoteAdmin(
    userId
  ) {
    if (
      !window.confirm(
        "Promote this user to administrator?"
      )
    ) {
      return;
    }

    try {
      await apiFetch(
        `${API}/admin/users/${userId}/promote`,
        {
          method: "POST",
        }
      );

      await loadAdminData();
    } catch (error) {
      alert(error.message);
    }
  }

  async function demoteAdmin(
    userId
  ) {
    if (
      !window.confirm(
        "Remove administrator access?"
      )
    ) {
      return;
    }

    try {
      await apiFetch(
        `${API}/admin/users/${userId}/demote`,
        {
          method: "POST",
        }
      );

      await loadAdminData();
    } catch (error) {
      alert(error.message);
    }
  }

  async function updateReport(
    reportId,
    status
  ) {
    try {
      await apiFetch(
        `${API}/admin/reports/${reportId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            status,
          }),
        }
      );

      await loadAdminData();
    } catch (error) {
      alert(error.message);
    }
  }

  if (loading) {
    return (
      <div>
        <h1>Settings</h1>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div>

      <h1>
        Settings
      </h1>

      {message && (
        <div
          style={{
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "10px",
            background: "#e8f5e9",
          }}
        >
          {message}
        </div>
      )}

      {/* ACCOUNT */}

      <div
        style={styles.settingsCard}
      >
        <h2>
          Account
        </h2>

        <p>
          {me?.username
            ? `Logged in as @${me.username}`
            : "Manage your DearLove account."}
        </p>

        <button
          type="button"
          style={styles.logoutButtonLarge}
          onClick={logout}
        >
          Logout
        </button>
      </div>


      {/* PRIVACY & SETTINGS */}

      <div
        style={styles.settingsCard}
      >
        <h2>
          Privacy & Notifications
        </h2>

        <label
          style={{
            display: "block",
            marginBottom: "15px",
          }}
        >
          <input
            type="checkbox"
            checked={
              settings.notifications_enabled
            }
            onChange={(e) =>
              updateSetting(
                "notifications_enabled",
                e.target.checked
              )
            }
          />{" "}
          Enable notifications
        </label>

        <label
          style={{
            display: "block",
            marginBottom: "15px",
          }}
        >
          <input
            type="checkbox"
            checked={
              settings.message_notifications
            }
            onChange={(e) =>
              updateSetting(
                "message_notifications",
                e.target.checked
              )
            }
          />{" "}
          Message notifications
        </label>

        <label
          style={{
            display: "block",
            marginBottom: "15px",
          }}
        >
          <input
            type="checkbox"
            checked={
              settings.location_sharing_enabled
            }
            onChange={(e) =>
              updateSetting(
                "location_sharing_enabled",
                e.target.checked
              )
            }
          />{" "}
          Allow location sharing
        </label>

        <label
          style={{
            display: "block",
            marginBottom: "15px",
          }}
        >
          <input
            type="checkbox"
            checked={
              settings.show_online_status
            }
            onChange={(e) =>
              updateSetting(
                "show_online_status",
                e.target.checked
              )
            }
          />{" "}
          Show online status
        </label>

        <label
          style={{
            display: "block",
          }}
        >
          <input
            type="checkbox"
            checked={
              settings.profile_discoverable
            }
            onChange={(e) =>
              updateSetting(
                "profile_discoverable",
                e.target.checked
              )
            }
          />{" "}
          Make my profile discoverable
        </label>
      </div>


      {/* BLOCKED USERS */}

      <div
        style={styles.settingsCard}
      >
        <h2>
          Blocked Users
        </h2>

        {blockedUsers.length === 0 ? (
          <p>
            You have not blocked anyone.
          </p>
        ) : (
          blockedUsers.map(user => (
            <div
              key={user.id}
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom:
                  "1px solid #eee",
              }}
            >
              <div>
                <strong>
                  {user.username}
                </strong>

                {user.full_name && (
                  <div>
                    {user.full_name}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  unblockUser(user.id)
                }
              >
                Unblock
              </button>
            </div>
          ))
        )}
      </div>


      {/* REPORT USER */}

      <div
        style={styles.settingsCard}
      >
        <h2>
          Report a User
        </h2>

        <input
          type="number"
          placeholder="User ID"
          value={reportUserId}
          onChange={(e) =>
            setReportUserId(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            boxSizing: "border-box",
          }}
        />

        <select
          value={reportReason}
          onChange={(e) =>
            setReportReason(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <option>Other</option>
          <option>Spam</option>
          <option>Harassment</option>
          <option>Fake profile</option>
          <option>Inappropriate content</option>
          <option>Scam</option>
        </select>

        <textarea
          placeholder="Describe the problem"
          value={reportDescription}
          onChange={(e) =>
            setReportDescription(
              e.target.value
            )
          }
          rows="4"
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            boxSizing: "border-box",
          }}
        />

        <button
          type="button"
          onClick={submitReport}
        >
          Submit Report
        </button>
      </div>


      {/* ADMIN DASHBOARD */}

      {isAdmin && (
        <div
          style={styles.settingsCard}
        >
          <h2>
            Admin Dashboard
          </h2>

          {adminLoading ? (
            <p>
              Loading administrator data...
            </p>
          ) : (
            <>
              {adminStats && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: "10px",
                    marginBottom: "20px",
                  }}
                >
                  <StatCard
                    icon="Users"
                    title="Users"
                    value={
                      adminStats.users
                    }
                  />

                  <StatCard
                    icon="Messages"
                    title="Messages"
                    value={
                      adminStats.messages
                    }
                  />

                  <StatCard
                    icon="Matches"
                    title="Matches"
                    value={
                      adminStats.matches
                    }
                  />

                  <StatCard
                    icon="Reports"
                    title="Reports"
                    value={
                      adminStats.reports
                    }
                  />
                </div>
              )}

              <h3>
                User Management
              </h3>

              {adminUsers.map(user => (
                <div
                  key={user.id}
                  style={{
                    padding: "12px 0",
                    borderBottom:
                      "1px solid #eee",
                  }}
                >
                  <strong>
                    {user.username}
                  </strong>

                  <div>
                    {user.email}
                  </div>

                  <small>
                    User ID: {user.id}
                  </small>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginTop: "8px",
                    }}
                  >
                    {user.is_suspended ? (
                      <button
                        type="button"
                        onClick={() =>
                          unsuspendUser(
                            user.id
                          )
                        }
                      >
                        Unsuspend
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          suspendUser(
                            user.id
                          )
                        }
                      >
                        Suspend
                      </button>
                    )}

                    {user.is_admin ? (
                      <button
                        type="button"
                        onClick={() =>
                          demoteAdmin(
                            user.id
                          )
                        }
                      >
                        Remove Admin
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          promoteAdmin(
                            user.id
                          )
                        }
                      >
                        Make Admin
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <h3
                style={{
                  marginTop: "25px",
                }}
              >
                Reports
              </h3>

              {adminReports.length === 0 ? (
                <p>
                  No reports.
                </p>
              ) : (
                adminReports.map(report => (
                  <div
                    key={report.id}
                    style={{
                      padding: "12px",
                      marginBottom: "10px",
                      border:
                        "1px solid #eee",
                      borderRadius: "10px",
                    }}
                  >
                    <strong>
                      Report #{report.id}
                    </strong>

                    <p>
                      {report.reporter_username}
                      {" â†’ "}
                      {report.reported_username}
                    </p>

                    <p>
                      Reason:{" "}
                      {report.reason}
                    </p>

                    {report.description && (
                      <p>
                        {report.description}
                      </p>
                    )}

                    <select
                      value={
                        report.status
                      }
                      onChange={(e) =>
                        updateReport(
                          report.id,
                          e.target.value
                        )
                      }
                    >
                      <option value="pending">
                        Pending
                      </option>

                      <option value="reviewing">
                        Reviewing
                      </option>

                      <option value="resolved">
                        Resolved
                      </option>

                      <option value="dismissed">
                        Dismissed
                      </option>
                    </select>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}

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
// LOCATION MAP
// =======================================================

function LocationMap({ latitude, longitude, title = "Location" }) {
  if (
    latitude === undefined ||
    latitude === null ||
    longitude === undefined ||
    longitude === null
  ) {
    return (
      <div style={styles.empty}>
        ðŸ“ No location available.
      </div>
    );
  }

  const position = [
    Number(latitude),
    Number(longitude),
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "350px",
        borderRadius: "15px",
        overflow: "hidden",
        marginTop: "20px",
      }}
    >
      <MapContainer
        center={position}
        zoom={15}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={position}>
          <Popup>
            ðŸ“ <strong>{title}</strong>
            <br />
            Latitude: {latitude}
            <br />
            Longitude: {longitude}
          </Popup>
        </Marker>
      </MapContainer>
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
// =======================================================
// CALL SCREEN
// =======================================================

  function CallScreen({
  user,
  callType,
  onEnd,
  currentUserId,
  me,
  incomingOffer = null,
  callWsRef,
}) {
const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState(
    incomingOffer ? "Incoming call..." : "Connecting..."
  );

  const wsRef = useRef(null);
  const peerRefLocal = useRef(null);
  const localStreamRefLocal = useRef(null);
  const remoteStreamRefLocal = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    let stopped = false;

    async function startCall() {
      try {
        if (!currentUserId || !user?.user_id) {
          setStatus("User information unavailable.");
          return;
        }

        setStatus("Starting microphone/camera...");

        let stream;

        try {
          stream =
            await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: callType === "video",
            });
        } catch (error) {
          console.error(
            "DearLove getUserMedia error:",
            error
          );

          setStatus(
            `Microphone/camera error: ${error.name} - ${error.message}`
          );

          return;
        }

        if (stopped) {
          stream.getTracks().forEach((track) =>
            track.stop()
          );
          return;
        }

        localStreamRefLocal.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const ws = callWsRef.current;

        if (!ws) {
          setStatus(
            "Call signaling connection unavailable."
          );
          return;
        }

        wsRef.current = ws;

        const peer =
          new RTCPeerConnection({
            iceServers: [
              {
                urls:
                  "stun:stun.l.google.com:19302",
              },
            ],
          });

        peerRefLocal.current = peer;

        const remoteStream =
          new MediaStream();

        remoteStreamRefLocal.current =
          remoteStream;

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject =
            remoteStream;
        }

        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream);
        });

        peer.ontrack = (event) => {
          console.log(
            "Remote track received"
          );

          if (event.streams?.[0]) {
            event.streams[0]
              .getTracks()
              .forEach((track) => {
                remoteStream.addTrack(track);
              });
          }
        };

        peer.onicecandidate = (event) => {
          if (
            event.candidate &&
            ws.readyState === WebSocket.OPEN
          ) {
            ws.send(
              JSON.stringify({
                type: "ice-candidate",
                receiver_id: user.user_id,
                candidate:
                  event.candidate,
              })
            );
          }
        };

        const handleMessage = async (event) => {
          try {
            const data =
              JSON.parse(event.data);

            console.log(
              "Call signaling received:",
              data
            );

            if (data.type === "answer") {
              if (
                peerRefLocal.current
              ) {
                await peerRefLocal.current.setRemoteDescription(
                  new RTCSessionDescription(
                    data.answer
                  )
                );

                setStatus(
                  "Call connected"
                );
              }

              return;
            }

            if (
              data.type === "ice-candidate" &&
              data.candidate
            ) {
              if (
                peerRefLocal.current
              ) {
                try {
                  await peerRefLocal.current.addIceCandidate(
                    new RTCIceCandidate(
                      data.candidate
                    )
                  );
                } catch (error) {
                  console.error(
                    "ICE candidate error:",
                    error
                  );
                }
              }

              return;
            }

            if (
              data.type === "call-ended"
            ) {
              setStatus("Call ended");
              onEnd();
            }
          } catch (error) {
            console.error(
              "Call signaling error:",
              error
            );
          }
        };

        ws.addEventListener(
          "message",
          handleMessage
        );

        if (incomingOffer) {
          try {
            setStatus(
              "Answering call..."
            );

            await peer.setRemoteDescription(
              new RTCSessionDescription(
                incomingOffer
              )
            );

            const answer =
              await peer.createAnswer();

            await peer.setLocalDescription(
              answer
            );

            if (
              ws.readyState ===
              WebSocket.OPEN
            ) {
              ws.send(
                JSON.stringify({
                  type: "answer",
                  receiver_id:
                    user.user_id,
                  answer: answer,
                })
              );
            }

            setStatus(
              "Call connected"
            );
          } catch (error) {
            console.error(
              "Answer creation error:",
              error
            );

            setStatus(
              "Unable to answer the call."
            );
          }
        } else {
          try {
            setStatus(
              "Creating call..."
            );

            const offer =
              await peer.createOffer();

            await peer.setLocalDescription(
              offer
            );

            if (
              ws.readyState !==
              WebSocket.OPEN
            ) {
              setStatus(
                "Call signaling connection unavailable."
              );
              return;
            }

            ws.send(
              JSON.stringify({
                type: "offer",
                receiver_id:
                  user.user_id,
                sender_id:
                  currentUserId,
                sender_username:
                  me?.username ||
                  "DearLove User",
                call_type: callType,
                offer: offer,
              })
            );

            setStatus("Calling...");
          } catch (error) {
            console.error(
              "Offer creation error:",
              error
            );

            setStatus(
              "Unable to start the call."
            );
          }
        }

        return () => {
          ws.removeEventListener(
            "message",
            handleMessage
          );
        };
      } catch (error) {
        console.error(
          "Call startup error:",
          error
        );

        setStatus(
          `Call startup error: ${error.message}`
        );
      }
    }

    startCall();

    return () => {
      stopped = true;

      if (localStreamRefLocal.current) {
        localStreamRefLocal.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        localStreamRefLocal.current =
          null;
      }

      if (remoteStreamRefLocal.current) {
        remoteStreamRefLocal.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        remoteStreamRefLocal.current =
          null;
      }

      if (peerRefLocal.current) {
        peerRefLocal.current.close();
        peerRefLocal.current = null;
      }

      wsRef.current = null;
    };
  }, [
    user,
    callType,
    currentUserId,
    incomingOffer,
    callWsRef,
    me,
    onEnd,
  ]);

  function endCall() {
    if (
      wsRef.current?.readyState ===
      WebSocket.OPEN
    ) {
      wsRef.current.send(
        JSON.stringify({
          type: "call-ended",
          receiver_id:
            user?.user_id,
        })
      );
    }

    onEnd();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#111827",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <h1>
        {callType === "video"
          ? "ðŸ“¹ Video Call"
          : "ðŸ“ž Voice Call"}
      </h1>

      <h2>
        {user?.username ||
          "DearLove User"}
      </h2>

      <p>{status}</p>

      {callType === "video" && (
        <div
          style={{
            width: "min(90vw, 700px)",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "100%",
              maxHeight: "45vh",
              objectFit: "cover",
              background: "black",
              borderRadius: "15px",
            }}
          />

          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              maxHeight: "30vh",
              background: "black",
              borderRadius: "15px",
            }}
          />
        </div>
      )}
      {/* MUTE BUTTON */}
      <button
        type="button"
        onClick={() => {
          const stream = localStreamRefLocal.current;

          if (!stream) {
            return;
          }

          stream.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
          });

          setMuted((previous) => !previous);
        }}
        style={{
          marginTop: "20px",
          padding: "14px 30px",
          border: "none",
          borderRadius: "30px",
          background: muted ? "#16a34a" : "#374151",
          color: "white",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        {muted ? "ðŸ”‡ Unmute" : "ðŸŽ™ï¸ Mute"}
      </button>

      {/* EXISTING END CALL BUTTON */}
      
<button
        type="button"
        onClick={endCall}
        style={{
          marginTop: "30px",
          padding: "14px 30px",
          border: "none",
          borderRadius: "30px",
          background: "#dc2626",
          color: "white",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        ðŸ”´ End Call
      </button>
    </div>
  );
}
