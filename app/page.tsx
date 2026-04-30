import { Heart, ClipboardList, Users, Smartphone } from 'lucide-react';
import LocaleStartCard from '@/components/shared/LocaleStartCard';

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

      <LocaleStartCard />

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

      <div className="mt-6 w-full flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white flex items-center justify-center">
          <Smartphone size={18} className="text-accent" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-main font-body">
            Want NextStep on your phone?
          </p>
          <p className="text-xs text-gray-600 font-body mt-1 leading-relaxed">
            You can use this link anytime. If you want a button on your home screen,
            tap Share on iPhone or the menu on Android, then tap Add to Home Screen.
          </p>
        </div>
      </div>
    </div>
  );
}
