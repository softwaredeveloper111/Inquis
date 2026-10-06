import {
  addDays,
  differenceInDays,
  format,
  parseISO,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export async function dateTime({ operation, date, date2, timezone, days}){
try {
      switch (operation) {
        // Current date and time
        case "current_time": {
          const tz = timezone || "Asia/Kolkata";

          return formatInTimeZone(
            new Date(),
            tz,
            "yyyy-MM-dd HH:mm:ss zzz"
          );
        }

        // Find day of week
        case "day_of_week": {
          const parsedDate = parseISO(date);

          return format(parsedDate, "EEEE");
        }

        // Difference between two dates
        case "date_difference": {
          const firstDate = parseISO(date);
          const secondDate = parseISO(date2);

          return `${Math.abs(
            differenceInDays(secondDate, firstDate)
          )} days`;
        }

        // Add days to a date
        case "add_days": {
          const parsedDate = parseISO(date);

          const result = addDays(parsedDate, days);

          return format(result, "yyyy-MM-dd");
        }

        // Convert current time to timezone
        case "timezone": {
          const tz = timezone || "Asia/Kolkata";

          return formatInTimeZone(
            new Date(),
            tz,
            "yyyy-MM-dd HH:mm:ss zzz"
          );
        }

        default:
          return "Unknown date/time operation.";
      }
    } catch (error) {
      return `Date/time error: ${error.message}`;
    }
}