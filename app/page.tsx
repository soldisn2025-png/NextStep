import Link from 'next/link';
import { ArrowRight, Heart, ClipboardList, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col items-center">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl text-text-main leading-tight mb-4">
          You just got a diagnosis.
          <br />
          <span className="text-primary">Here's what to do next.</span>
        </h1>
        <p className="text-base text-gray-600 font-body max-w-md mx-auto leading-relaxed">
          NextStep guides parents of newly diagnosed autistic children through a short
          set of questions and delivers a clear, prioritized list of first steps —
          specific to your child's age, diagnosis, and situation.
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/intake"
        aria-label="Start the intake questionnaire"
        className="
          inline-flex items-center gap-2
          bg-accent text-white font-body font-medium
          px-8 py-4 rounded-2xl text-base
          hover:bg-amber-500 transition-colors duration-150
          shadow-sm
        "
      >
        Start Here
        <ArrowRight size={18} />
      </Link>

      {/* Feature callouts */}
      <div className="mt-12 w-full grid grid-cols-1 gap-4">
        <div className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <ClipboardList size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-main font-body">Takes about 2 minutes</p>
            <p className="text-xs text-gray-500 font-body mt-0.5">6 simple questions about your child and situation.</p>
          </div>
        </div>
        <div className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-main font-body">Calm, clear guidance</p>
            <p className="text-xs text-gray-500 font-body mt-0.5">No jargon. No overwhelm. Just what matters most right now.</p>
          </div>
        </div>
        <div className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Users size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-main font-body">Built for parents</p>
            <p className="text-xs text-gray-500 font-body mt-0.5">Your answers shape the next steps — nothing generic.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
