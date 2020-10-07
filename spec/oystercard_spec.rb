require 'oystercard'

describe Oystercard do
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
    before do
      subject.top_up(Oystercard::MINIMUM_PERMITTED_FARE)
      subject.touch_in
    end

    # it 'deducts from the balance' do
    #   subject.deduct(10)
    #   expect(subject.balance).to eq(-9)
    # end

    it '#touch_in returns true when touching in' do
      expect(subject.touch_in).to eq true
    end

    it '#touch_out returns false when touching out' do
      expect(subject.touch_out).to eq false
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
  end

  it "#touch_in throws an error when card doesn't have enough balance for a journey" do
    expect{ subject.touch_in }.to raise_error(RuntimeError, "Not enough money on card")
  end

end
