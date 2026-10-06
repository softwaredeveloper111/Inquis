import LoginCard from "../components/LoginCard";
import styles from "./LoginPage.module.scss";

const LoginPage = () => {
  return (
    <div className={styles.page}>
      <LoginCard />
    </div>
  );
};

export default LoginPage;