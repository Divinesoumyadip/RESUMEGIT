export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-black uppercase tracking-tighter italic">
        Mission <span className="text-amber-500">Control</span>
      </h1>
      <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
        <p className="text-gray-400 font-bold uppercase text-sm tracking-widest">
          Systems Online. Ready for Resume Generation.
        </p>
      </div>
    </div>
  )
}
