import { getParticipantsWithConsensus } from '@/lib/db';
import { saveConsensusOverride, recalculateConsensus } from '@/app/consensus/actions';

export default async function ConsensusPage() {
  const participants = await getParticipantsWithConsensus();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Participant Consensus</h1>
        
        <div className="mb-4">
          <form action={recalculateConsensus} className="flex items-center space-x-3">
            <button 
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Recalculate Consensus from Evaluations
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Photo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consensus Level
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Ranking
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {participants.map((participant) => (
                <tr key={participant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {participant.photoUrl ? (
                      <img 
                        src={participant.photoUrl} 
                        alt={participant.name} 
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-600">No Photo</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {participant.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <form action={saveConsensusOverride} className="flex space-x-2" method="POST">
                      <input
                        type="hidden"
                        name="participantId"
                        value={participant.id}
                      />
                      <input
                        type="text"
                        name="consensusLevel"
                        value={participant.consensusLevel ?? ''}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter level"
                      />
                      <button 
                        type="submit"
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <form action={saveConsensusOverride} className="flex space-x-2" method="POST">
                      <input
                        type="hidden"
                        name="participantId"
                        value={participant.id}
                      />
                      <input
                        type="number"
                        name="averageRanking"
                        value={participant.averageRanking ?? ''}
                        step="0.1"
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter ranking"
                      />
                      <button 
                        type="submit"
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <p className="text-gray-500">
                      Last updated: {participant.updatedAt ? new Date(participant.updatedAt).toLocaleString() : 'Never'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}