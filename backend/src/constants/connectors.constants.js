// Har connector ke liye Google scopes (read + write). Naya service add karna ho to bas yahan entry add karo.
// NOTE: scopes badalne par existing users ko dobara connect karna padega.
export const SERVICES = {
  gmail: {
    // read + draft + send + labels (permanent delete nahi)
    scopes: ["https://www.googleapis.com/auth/gmail.modify"],
  },
  calendar: {
    // events dekhna, banana, edit, delete
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
  },
  drive: {
      scopes: ["https://www.googleapis.com/auth/drive"],
  },
};

export const SERVICE_KEYS = Object.keys(SERVICES);

// email address dikhane ke liye (card par "connected as ...")
export const BASE_SCOPES = ["openid", "email"];