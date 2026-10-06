import SignupCard from "../components/SignupCard";
import styles from "./SignupPage.module.scss";

const SignupPage = () => {
  return (
    <div className={styles.page}>
      <SignupCard />
    </div>
  );
};

export default SignupPage;