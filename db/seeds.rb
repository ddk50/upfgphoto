# -*- coding: utf-8 -*-
#
Whitelist.find_or_create_by!(nickname: "tatarou1986",
                             description: "ファーストマン",
                             status: 2)

first_man = Employee.find_or_create_by!(uid: 279930495,
                                        provider: 'twitter',
                                        rank: 0,
                                        name: 'tatarou1986')

Board.find_or_create_by!(employee_id: first_man.id,
                         caption: "Publicボード",
                         description: "雑に写真を共有するボードです．みんなでワイワイと貼りましょう",
                         specialized: true,
                         :public => true)
