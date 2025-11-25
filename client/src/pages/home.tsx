import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Brain, TrendingUp, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      <div className="relative h-96 md:h-[500px] w-full bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6" data-testid="text-hero-title">
            Quality Education for Everyone
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            AI-powered adaptive learning platform providing free access to curated educational resources from the world's best open knowledge bases.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/courses">
              <Button size="lg" className="font-semibold" data-testid="button-browse-courses">
                Browse Courses
              </Button>
            </Link>
            <Link href="/interests">
              <Button size="lg" variant="outline" className="font-semibold backdrop-blur-sm" data-testid="button-get-started">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="p-6 hover-elevate" data-testid="card-feature-personalized">
            <div className="mb-4">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 font-heading">AI-Powered Curation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Smart recommendations match your learning goals with relevant courses from open educational resources.
            </p>
          </Card>

          <Card className="p-6 hover-elevate" data-testid="card-feature-tiered">
            <div className="mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 font-heading">Tiered Learning</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Progress from beginner to advanced with structured modules adapted to your pace.
            </p>
          </Card>

          <Card className="p-6 hover-elevate" data-testid="card-feature-flashcards">
            <div className="mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 font-heading">Interactive Learning</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Flashcards and assessments help reinforce knowledge and track your understanding.
            </p>
          </Card>

          <Card className="p-6 hover-elevate" data-testid="card-feature-accessible">
            <div className="mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2 font-heading">Accessible to All</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Optimized for low-bandwidth environments, ensuring quality education reaches everyone.
            </p>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 font-heading">Ready to Start Learning?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Tell us your interests and let AI curate the perfect learning path for you.
          </p>
          <Link href="/interests">
            <Button size="lg" data-testid="button-set-interests">
              Set Your Learning Interests
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
