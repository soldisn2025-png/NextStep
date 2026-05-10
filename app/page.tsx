import { Heart, ClipboardList, Users } from 'lucide-react';
import LocaleStartCard from '@/components/shared/LocaleStartCard';

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col items-center">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl font-bold text-text-main leading-tight mb-4">
          You just got a diagnosis.
          <br />
          <span className="text-primary">Here&apos;s what to do next.</span>
        </h1>
        <p className="text-base text-gray-500 font-body max-w-md mx-auto leading-relaxed">
          NextStep guides parents of newly diagnosed autistic children through a short
          set of questions and delivers a clear, prioritized list of first steps —
          specific to your child&apos;s age, diagnosis, and situation.
        </p>
      </div>

      <LocaleStartCard />

      {/* Feature callouts */}
      <div className="mt-10 w-full divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main font-body">Takes about 2 minutes</p>
            <p className="text-xs text-gray-500 font-body mt-0.5">6 simple questions about your child and situation.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Heart size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main font-body">Calm, clear guidance</p>
            <p className="text-xs text-gray-500 font-body mt-0.5">No jargon. No overwhelm. Just what matters most right now.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-main font-body">Built for parents</p>
            <p className="text-xs text-gray-500 font-body mt-0.5">Your answers shape the next steps — nothing generic.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
