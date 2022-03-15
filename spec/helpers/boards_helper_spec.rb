require 'rails_helper'

RSpec.describe BoardsHelper, :type => :helper do
  it 'should help for the album tree' do
    board_1 = Board.new

    album_1 = BoardsHelper::Album.new("to", board_1)
    dir_1   = BoardsHelper::Dir.new("path")
    dir_2   = BoardsHelper::Dir.new("path")

    hash = {}

    expect(dir_1).to_not eq(album_1)
    expect(dir_1).to_not eq(dir_2)

    hash[dir_1] = "yes"
    hash[dir_1] = "no"

    expect(hash[dir_1]).to eq("no")

    hash[dir_2] = "1. initialize"
    hash[dir_1] = "2. override"

    expect(hash[dir_1]).to eq("2. override")
    expect(hash[album_1]).not_to eq("2. override")

    expect(dir_1.eql?(album_1)).to eq(false)
  end

  it 'should build tree' do
    captions = [
      ["2021/path_0/to_0", Board.new],
      ["2021/path_0/to_1", Board.new],
      ["2021/path_0/to_2", Board.new],
      ["2021/path_0/to_3", Board.new],
      ["2021/path_0/to_4", Board.new],
      ["2021/path_1/to_5", Board.new],
      ["2022/path_0/to_0", Board.new],
      ["2022/path_0/to_1", Board.new],
      ["2022/path_0/to_2", Board.new],
      ["2022/path_0/to_3", Board.new],
    ]
    treehash   = {}

    captions.each{|c|
      insert_tree(treehash, c[0].split("/"), c[1])
    }

    #
    # 2021/*
    #
    expect(treehash[BoardsHelper::Dir.new("2021")].size).to eq(2)

    #
    # 2022/*
    #
    expect(treehash[BoardsHelper::Dir.new("2022")].size).to eq(1)

    #
    # 2022/path_0/*
    #
    level_0_0 = treehash[BoardsHelper::Dir.new("2021")]
    level_1_0 = level_0_0[BoardsHelper::Dir.new("path_0")]
    expect(level_1_0.size).to eq(5)

    #
    # 2022/path_1/*
    #
    level_0_1 = treehash[BoardsHelper::Dir.new("2022")]
    level_1_1 = level_0_0[BoardsHelper::Dir.new("path_1")]
    expect(level_1_1.size).to eq(1)


    #
    # 2022/path_0/*
    #
    level_2_0 = level_0_1[BoardsHelper::Dir.new("path_0")]
    expect(level_2_0.size).to eq(4)
  end
end