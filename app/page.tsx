import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import RulesList from "@/components/RulesList";


const GITHUB_URL = "https://github.com/YOUR-USERNAME/upgradelens"; // replace with your repo

export default function Home() {
  return (
    <>
      <Header githubUrl={GITHUB_URL} />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <RulesList />
      </main>
      <Footer />
    </>
  );
}