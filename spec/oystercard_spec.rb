require 'oystercard'

describe Oystercard do
  it 'gives a default balance of 0' do
    expect(subject.instance_variable_get(:@balance)).to eq 0
  end

  it 'adds to the balance' do
    subject.top_up(10)
    expect(subject.instance_variable_get(:@balance)).to eq 10
  end

  it 'raises an error if balance limit is exceeded' do
    balance_limit = Oystercard::BALANCE_LIMIT
    subject.top_up(balance_limit)
    expect{ subject.top_up(1) }.to raise_error(RuntimeError, "Top-up failed. Balance limit of #{balance_limit} exceeded.")
  end

  it 'deducts from the balance' do
    subject.top_up(20)
    subject.deduct(10)
    expect(subject.balance).to eq 10
  end

  it '#touch_in returns true when touching in' do
    expect(subject.touch_in).to eq true
  end

  it '#touch_out returns false when touching out' do
    expect(subject.touch_out).to eq false
  end

  it '#in_journey lets us know if we are in journey when we have touched in' do
    subject.touch_in
    expect(subject.in_journey?).to eq true
  end
  it '#in_journey lets us know if we are in journey when we have touched out' do
    subject.touch_out
    expect(subject.in_journey?).to eq false
  end
end
