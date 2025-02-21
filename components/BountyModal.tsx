import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BuildRequest } from "@/lib/api/types";

interface BountyModalProps {
  buildRequest: BuildRequest;
  isOpen: boolean;
  onClose: () => void;
}

export function BountyModal({
  buildRequest,
  isOpen,
  onClose,
}: BountyModalProps) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDC");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");

  // Calculate default deadline (2 weeks from now)
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
  const defaultDeadline = twoWeeksFromNow.toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create the Warpcast intent URL
    const intentUrl = new URL("https://warpcast.com/~/compose");

    // Format the text for the bounty
    const bountyText = `I'd love for someone to build this!\n\nAmount: ${amount} ${currency}${deadline ? `\nDeadline: ${deadline}` : ""}${description ? `\n\n${description}` : ""}\n\n@bountybot`;

    intentUrl.searchParams.set("text", bountyText);
    intentUrl.searchParams.set(
      "embeds[]",
      `https://warpcast.com/${buildRequest.author.username}/${buildRequest.hash}`,
    );

    // Open in new tab
    window.open(intentUrl.toString(), "_blank");
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-purple-900/90 p-6 text-left align-middle shadow-xl transition-all border border-purple-400/20">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-medium leading-6 text-purple-100"
                  >
                    Post Bounty
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-purple-300 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-purple-200">
                    Create a bounty for this build request using @bountybot
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label
                        htmlFor="amount"
                        className="block text-sm font-medium text-purple-200 mb-2"
                      >
                        Amount
                      </label>
                      <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="50"
                        className="w-full px-4 py-2 bg-purple-800/50 border border-purple-700 rounded-lg 
                                 text-purple-100 placeholder-purple-400 focus:outline-none focus:ring-2 
                                 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="w-1/3">
                      <label
                        htmlFor="currency"
                        className="block text-sm font-medium text-purple-200 mb-2"
                      >
                        Currency
                      </label>
                      <select
                        id="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-4 py-2 bg-purple-800/50 border border-purple-700 rounded-lg 
                                 text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 
                                 focus:border-transparent"
                      >
                        <option value="USDC">USDC</option>
                        <option value="ETH">ETH</option>
                        <option value="DEGEN">DEGEN</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="deadline"
                      className="block text-sm font-medium text-purple-200 mb-2"
                    >
                      Deadline (Optional)
                    </label>
                    <input
                      type="date"
                      id="deadline"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      placeholder={defaultDeadline}
                      className="w-full px-4 py-2 bg-purple-800/50 border border-purple-700 rounded-lg 
                               text-purple-100 placeholder-purple-400 focus:outline-none focus:ring-2 
                               focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-purple-200 mb-2"
                    >
                      Additional Description (Optional)
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add any additional details or requirements..."
                      className="w-full px-4 py-2 bg-purple-800/50 border border-purple-700 rounded-lg 
                               text-purple-100 placeholder-purple-400 focus:outline-none focus:ring-2 
                               focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-purple-200 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg 
                               bg-gradient-to-r from-yellow-400 to-yellow-300 p-[2px] font-medium text-purple-900 
                               shadow-xl shadow-yellow-400/20 transition-all duration-300 hover:shadow-yellow-400/40
                               hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span
                        className="relative flex items-center space-x-2 rounded-lg bg-gradient-to-r from-yellow-400 
                                 to-yellow-300 px-6 py-2.5 transition-all duration-200 ease-out group-hover:bg-opacity-0 
                                 group-hover:from-yellow-300 group-hover:to-yellow-200"
                      >
                        Post Bounty
                      </span>
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
