require 'oystercard'

describe Oystercard do
  let (:london) {double :station}

  describe "balance" do
    it 'gives a default balance of 0' do
      expect(subject.balance).to eq 0
    end
  end

  it 'adds to the balance' do
    subject.top_up(10)
    expect(subject.balance).to eq 10
  end

  it 'raises an error if balance limit is exceeded' do
    expect{ subject.top_up(Oystercard::BALANCE_LIMIT + 1) }.to raise_error(RuntimeError, "Top-up failed. Balance limit of #{Oystercard::BALANCE_LIMIT} exceeded.")
  end

  describe 'top up for tests' do
    let (:station) {double :station}
    before do
      subject.top_up(Oystercard::MINIMUM_PERMITTED_FARE)
      subject.touch_in(london)
    end

    it '#touch_in returns true when touching in' do
      expect(subject.touch_in(station)).to eq station
    end

    it '#touch_out returns false when touching out' do
      expect(subject.touch_out).to eq nil
    end

    it '#in_journey lets us know if we are in journey when we have touched in' do
      expect(subject.in_journey?).to eq true
    end

    it '#in_journey lets us know if we are in journey when we have touched out' do
      subject.touch_out
      expect(subject.in_journey?).to eq false
    end

    it "#touch_out deducts minimum fare once journey is complete" do
      expect {subject.touch_out}.to change{subject.balance}.by(-1)
    end

    it "#touch_in logs entry station after user touches in" do
      expect(subject.entry_station).to eq london
    end
  end

  it "#touch_in throws an error when card doesn't have enough balance for a journey" do
    london = double('london')
    expect{ subject.touch_in(london) }.to raise_error(RuntimeError, "Not enough money on card")
  end

  describe 'journeys history' do
    it 'checks than journeys array is empty' do
      expect(subject.journeys_history).to eq []
    end

  end
end
